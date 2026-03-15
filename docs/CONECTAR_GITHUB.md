# Conectar el proyecto Avila con GitHub

Pasos para subir el repositorio local a GitHub y dejarlo conectado.

---

## 1. Tener Git instalado

- Si al ejecutar `git --version` en una terminal no funciona, instalá Git: https://git-scm.com/download/win  
- Reiniciá la terminal después de instalar.

---

## 2. Crear el repositorio en GitHub

1. Entrá a **https://github.com** e iniciá sesión.
2. Clic en **"+"** (arriba a la derecha) → **"New repository"**.
3. Completá:
   - **Repository name**: por ejemplo `avila` o `casa-repuestos`.
   - **Description** (opcional): "Sistema POS y gestión - Casa de repuestos".
   - Dejá **Private** o **Public** según prefieras.
   - **No** marques "Add a README", "Add .gitignore" ni "Choose a license" (el proyecto ya tiene contenido).
4. Clic en **"Create repository"**.

GitHub te muestra la URL del repo. Para este proyecto ya tenés:
- **AvilaPos**: `https://github.com/agustinavila290-commits/AvilaPos.git`

---

## 3. Conectar tu carpeta local con GitHub

Abrí **CMD** o **PowerShell** en la carpeta del proyecto (o usá el script más abajo) y ejecutá:

```bash
cd c:\Users\Agustin\Documents\Avila
```

Si todavía **no tenés ningún remote**:

```bash
git remote add origin https://github.com/agustinavila290-commits/AvilaPos.git
```

Si **ya tenés un remote** y querés reemplazarlo por AvilaPos:

```bash
git remote remove origin
git remote add origin https://github.com/agustinavila290-commits/AvilaPos.git
```

Verificar:

```bash
git remote -v
```

Deberías ver algo como:
```
origin  https://github.com/agustinavila290-commits/AvilaPos.git (fetch)
origin  https://github.com/agustinavila290-commits/AvilaPos.git (push)
```

---

## 4. Subir el código (primera vez)

```bash
git add .
git status
git commit -m "Subir proyecto Avila (POS, backend, avila-web, docs)"
git branch -M main
git push -u origin main
```

Si Git te pide usuario y contraseña:

- **Usuario**: tu usuario de GitHub.
- **Contraseña**: ya no se usa la contraseña de la cuenta; tenés que usar un **Personal Access Token (PAT)**:
  1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
  2. **Generate new token**, marcar al menos `repo`.
  3. Copiá el token y usalo como contraseña cuando `git push` lo pida.

---

## 5. Resumen de comandos (copiar y pegar)

Para **AvilaPos** (repo ya creado):

```bash
cd c:\Users\Agustin\Documents\Avila
git remote add origin https://github.com/agustinavila290-commits/AvilaPos.git
git add .
git commit -m "Subir proyecto Avila (POS, backend, avila-web)"
git branch -M main
git push -u origin main
```

---

## 6. Después de conectar

- Para subir cambios más adelante: `git add .` → `git commit -m "mensaje"` → `git push`.
- Para conectar **Vercel**: en vercel.com, "Add New Project" y elegí este repo de GitHub; Vercel se conecta solo y hace deploy en cada push si lo configurás así.
