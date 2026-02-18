from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, OuterRef, Subquery, Value, IntegerField
from django.db.models.functions import Coalesce
from django.db import transaction
import openpyxl

from .models import Marca, Categoria, ProductoBase, VarianteProducto
from .serializers import (
    MarcaSerializer, CategoriaSerializer,
    ProductoBaseSerializer, ProductoBaseCreateSerializer,
    VarianteProductoSerializer, VarianteProductoCreateSerializer,
    ProductoConVariantesSerializer, ImportacionExcelSerializer,
    VarianteListSerializer
)
from .search_utils import search_term_variants, search_words
from .excel_utils import get_excel_header_map, cell_str, cell_number, cell_int, normalize_header, EXCEL_REQUIRED_COLUMNS, EXCEL_OPTIONAL_COLUMNS
from rest_framework.pagination import PageNumberPagination
from apps.usuarios.permissions import IsCajero, IsAdministrador
from apps.inventario.models import Deposito, MovimientoStock, Stock
from apps.inventario.services import InventarioService


class VarianteSearchPagination(PageNumberPagination):
    """Búsqueda rápida: pocos resultados por defecto para respuesta casi instantánea."""
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 200


class MarcaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Marcas"""
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    
    def get_permissions(self):
        """Solo admin puede crear/editar/eliminar marcas"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo_bool = activo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(activo=activo_bool)
        return queryset.order_by('nombre')


class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Categorías"""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsCajero]
    
    def get_permissions(self):
        """Solo admin puede crear/editar/eliminar categorías"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            activo_bool = activo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(activo=activo_bool)
        return queryset.order_by('nombre')


class ProductoBaseViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Productos Base"""
    queryset = ProductoBase.objects.select_related('marca', 'categoria').prefetch_related('variantes')
    permission_classes = [IsAuthenticated, IsCajero]
    
    def get_permissions(self):
        """Solo admin puede crear/editar/eliminar productos"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductoConVariantesSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductoBaseCreateSerializer
        return ProductoBaseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        marca = self.request.query_params.get('marca', None)
        categoria = self.request.query_params.get('categoria', None)
        activo = self.request.query_params.get('activo', None)
        search = self.request.query_params.get('search', None)
        
        if marca:
            queryset = queryset.filter(marca_id=marca)
        
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        
        if activo is not None:
            activo_bool = activo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(activo=activo_bool)
        
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(marca__nombre__icontains=search)
            )
        
        return queryset.order_by('-fecha_creacion')

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'detail': str(e), 'error_type': type(e).__name__},
                status=status.HTTP_400_BAD_REQUEST
            )


class VarianteProductoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Variantes de Producto"""
    queryset = VarianteProducto.objects.select_related(
        'producto_base',
        'producto_base__marca',
        'producto_base__categoria'
    )
    permission_classes = [IsAuthenticated, IsCajero]
    pagination_class = VarianteSearchPagination
    
    def get_permissions(self):
        """Solo admin puede crear/editar/eliminar variantes"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdministrador()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VarianteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VarianteProductoCreateSerializer
        return VarianteProductoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        producto_base = self.request.query_params.get('producto_base', None)
        codigo = self.request.query_params.get('codigo', None)
        search = self.request.query_params.get('search', None)
        
        if producto_base:
            queryset = queryset.filter(producto_base_id=producto_base)
        
        if codigo:
            queryset = queryset.filter(codigo__iexact=codigo)
        
        if search:
            search_clean = search.strip()
            # Atajo: si parece un solo código (sin espacios, longitud razonable), búsqueda exacta primero (índice, 1 resultado)
            if search_clean and not search_clean.isspace() and ' ' not in search_clean and len(search_clean) <= 80:
                exact = queryset.filter(codigo__iexact=search_clean).first()
                if exact:
                    pk_list = [exact.pk]
                    queryset = queryset.filter(pk__in=pk_list)
                    search_clean = None  # ya no aplicar filtro por palabras
            if search_clean:
                # Búsqueda por palabras: código, nombre de producto, nombre variante, descripción, marca
                words = search_words(search_clean, min_word_len=1)
                if not words:
                    words = [search_clean]
                first = True
                for word in words:
                    # Reducir variantes para términos largos (menos ORs = query más rápida)
                    search_variants = search_term_variants(word) if len(word) <= 20 else [word, word.lower(), word.capitalize()]
                    q_word = Q()
                    for term in search_variants:
                        q_word |= (
                            Q(codigo__icontains=term) |
                            Q(nombre_variante__icontains=term) |
                            Q(producto_base__nombre__icontains=term) |
                            Q(producto_base__descripcion__icontains=term) |
                            Q(producto_base__marca__nombre__icontains=term)
                        )
                    if first:
                        q_total = q_word
                        first = False
                    else:
                        q_total = q_total & q_word
                queryset = queryset.filter(q_total).distinct()
        
        # Listado: anotar stock en una sola query para evitar N+1
        if self.action == 'list':
            subq = Stock.objects.filter(
                variante=OuterRef('pk'),
                deposito__activo=True
            ).values('variante').annotate(total=Sum('cantidad')).values('total')[:1]
            queryset = queryset.annotate(
                stock_actual_anno=Coalesce(Subquery(subq), Value(0, output_field=IntegerField()))
            )
        
        return queryset.order_by('-fecha_creacion')
    
    @action(detail=False, methods=['get'])
    def buscar_codigo(self, request):
        """Búsqueda por código exacto"""
        codigo = request.query_params.get('codigo', None)
        
        if not codigo:
            return Response(
                {'error': 'Debes proporcionar un código'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            variante = VarianteProducto.objects.select_related(
                'producto_base',
                'producto_base__marca',
                'producto_base__categoria'
            ).filter(codigo__iexact=codigo).first()
            
            if variante:
                serializer = VarianteProductoSerializer(variante)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Producto no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdministrador])
    def importar_excel(self, request):
        """
        Importación masiva desde archivo Excel.
        Agrupa productos por nombre y crea variantes.
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No se proporcionó ningún archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        excel_file = request.FILES['file']
        
        # Validar extensión
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response(
                {'error': 'El archivo debe ser un Excel (.xlsx o .xls)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            workbook = openpyxl.load_workbook(excel_file)
            sheet = workbook.active
            
            # Leer encabezados (primera fila) y mapear a nombres internos
            raw_headers = [cell.value for cell in sheet[1]]
            header_map = get_excel_header_map(raw_headers)
            missing = [c for c in EXCEL_REQUIRED_COLUMNS if c not in header_map.values()]
            if missing:
                return Response(
                    {'error': f'Faltan columnas requeridas: {", ".join(missing)}. Mínimo: {", ".join(EXCEL_REQUIRED_COLUMNS)}. Opcionales: nombre_variante, categoria, precio_web.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Depósito principal para stock inicial (opcional)
            deposito_principal = Deposito.objects.filter(es_principal=True, activo=True).first()

            # Procesar filas
            productos_creados = 0
            variantes_creadas = 0
            errores = []
            
            # Usar transacción principal para agrupar todo, pero savepoints por fila
            with transaction.atomic():
                for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                    # Savepoint para cada fila: si falla una, las demás continúan
                    sid = transaction.savepoint()
                    try:
                        # Diccionario por nombre interno (codigo, nombre_producto, etc.)
                        row_data = {}
                        for i, val in enumerate(row):
                            if i < len(raw_headers) and raw_headers[i] is not None:
                                internal = header_map.get(normalize_header(raw_headers[i]))
                                if internal:
                                    row_data[internal] = val
                        
                        # Saltar filas vacías
                        if not row_data.get('codigo'):
                            transaction.savepoint_commit(sid)
                            continue
                        
                        # Obtener o crear marca
                        marca, _ = Marca.objects.get_or_create(
                            nombre=cell_str(row_data['marca']),
                            defaults={'activo': True}
                        )
                        
                        # Obtener o crear categoría (por defecto "General" si no viene)
                        nombre_categoria = cell_str(row_data.get('categoria', EXCEL_OPTIONAL_COLUMNS['categoria']))
                        categoria, _ = Categoria.objects.get_or_create(
                            nombre=nombre_categoria or 'General',
                            defaults={'activo': True}
                        )
                        
                        # Obtener o crear producto base
                        producto_base, created = ProductoBase.objects.get_or_create(
                            nombre=cell_str(row_data['nombre_producto']),
                            marca=marca,
                            defaults={
                                'categoria': categoria,
                                'activo': True
                            }
                        )
                        
                        if created:
                            productos_creados += 1
                        
                        # Obtener o crear variante (evita duplicados por producto_base + nombre_variante)
                        nombre_var = cell_str(row_data.get('nombre_variante', EXCEL_OPTIONAL_COLUMNS['nombre_variante'])) or 'Única'
                        precio_web_val = cell_number(row_data.get('precio_web', EXCEL_OPTIONAL_COLUMNS['precio_web']))
                        codigo_var = cell_str(row_data['codigo'])
                        
                        variante, variante_created = VarianteProducto.objects.get_or_create(
                            producto_base=producto_base,
                            nombre_variante=nombre_var,
                            defaults={
                                'codigo': codigo_var,
                                'costo': cell_number(row_data['costo']),
                                'precio_mostrador': cell_number(row_data['precio_mostrador']),
                                'precio_web': precio_web_val,
                                'activo': True
                            }
                        )
                        
                        # Si la variante ya existía, actualizar código/precios si cambió
                        if not variante_created:
                            actualizado = False
                            if variante.codigo != codigo_var:
                                variante.codigo = codigo_var
                                actualizado = True
                            if variante.costo != cell_number(row_data['costo']):
                                variante.costo = cell_number(row_data['costo'])
                                actualizado = True
                            if variante.precio_mostrador != cell_number(row_data['precio_mostrador']):
                                variante.precio_mostrador = cell_number(row_data['precio_mostrador'])
                                actualizado = True
                            if variante.precio_web != precio_web_val:
                                variante.precio_web = precio_web_val
                                actualizado = True
                            if actualizado:
                                variante.save()
                        else:
                            variantes_creadas += 1

                        # Stock inicial (columna opcional): registrar en depósito principal
                        stock_inicial = cell_int(row_data.get('stock_inicial'))
                        if stock_inicial > 0 and deposito_principal:
                            InventarioService.registrar_movimiento(
                                variante=variante,
                                deposito=deposito_principal,
                                tipo_movimiento=MovimientoStock.TipoMovimiento.INVENTARIO_INICIAL,
                                cantidad=stock_inicial,
                                usuario=request.user,
                                observaciones='Importación Excel'
                            )
                        
                        # Confirmar savepoint si todo salió bien
                        transaction.savepoint_commit(sid)
                        
                    except Exception as e:
                        # Revertir savepoint de esta fila y continuar con la siguiente
                        transaction.savepoint_rollback(sid)
                        errores.append({
                            'fila': row_num,
                            'error': str(e),
                            'datos': row_data
                        })
            
            return Response({
                'success': True,
                'productos_creados': productos_creados,
                'variantes_creadas': variantes_creadas,
                'errores': errores,
                'total_errores': len(errores)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error al procesar el archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
