from django.contrib import admin
from .models import Marca, Categoria, ProductoBase, VarianteProducto


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)


class VarianteProductoInline(admin.TabularInline):
    model = VarianteProducto
    extra = 1
    fields = ('nombre_variante', 'codigo', 'costo', 'precio_mostrador', 'precio_web', 'activo')


@admin.register(ProductoBase)
class ProductoBaseAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'marca', 'categoria', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'marca', 'categoria')
    search_fields = ('nombre', 'marca__nombre', 'categoria__nombre')
    inlines = [VarianteProductoInline]


@admin.register(VarianteProducto)
class VarianteProductoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'producto_base', 'nombre_variante', 'costo', 'precio_mostrador', 'margen_porcentaje', 'activo')
    list_filter = ('activo', 'producto_base__marca', 'producto_base__categoria')
    search_fields = ('codigo', 'producto_base__nombre', 'nombre_variante')
    readonly_fields = ('margen_porcentaje', 'margen_monto', 'fecha_creacion', 'fecha_actualizacion')
