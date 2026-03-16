## Comandos para conectarse al servidor

### Datos del servidor

- **IP**: `138.219.42.174`
- **Dominio POS**: `sistema.avilamotorepuesto.com.ar`
- **Puerto SSH**: `5469`

### Conectarse por SSH

Desde tu PC (PowerShell o CMD), en cualquier carpeta:

```bash
ssh -p 5469 root@138.219.42.174
```

O usando el dominio:

```bash
ssh -p 5469 root@sistema.avilamotorepuesto.com.ar
```

### Copiar archivos al servidor (scp)

Ejecutar estos comandos desde la carpeta `Avila` en tu PC.

- **Copiar un script a `/root/`**:

```bash
scp -P 5469 scripts/setup_servidor_ubuntu.sh root@138.219.42.174:/root/
```

- **Copiar el script de actualizar frontend**:

```bash
scp -P 5469 scripts/actualizar_frontend.sh root@138.219.42.174:/root/
```

- **Copiar cualquier archivo suelto**:

```bash
scp -P 5469 RUTA/DEL/ARCHIVO.ext root@138.219.42.174:/root/
```

### Accesos rápidos (navegador)

- **POS**: `https://sistema.avilamotorepuesto.com.ar/`
- **Admin Django**: `https://sistema.avilamotorepuesto.com.ar/admin/`

Tené este archivo como referencia rápida cuando necesites conectarte o copiar archivos al servidor.

