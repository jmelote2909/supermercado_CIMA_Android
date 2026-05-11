# Supermercado CIMA (Android) 🛒

Esta es la aplicación móvil oficial del **Supermercado CIMA**, desarrollada con [Expo](https://expo.dev) y [React Native](https://reactnative.dev/). La aplicación permite a los usuarios navegar por el catálogo de productos, realizar pedidos y gestionar sus compras de manera eficiente.

## 🚀 Tecnologías Utilizadas

- **App & Web:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Backend:** Node.js + Express
- **Base de Datos:** SQLite
- **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction)
- **Actualizaciones:** Expo OTA Updates

---

## 🛠️ GUÍA DE DESPLIEGUE (RED LOCAL)

Esta configuración permite que las tablets de la empresa se conecten a un ordenador central que sirve como base de datos.

### 1. Preparar el Ordenador Central (Servidor)

1. **Instalar Node.js:** Descarga la versión LTS en [nodejs.org](https://nodejs.org/).
2. **Fijar IP Estática (Crucial):**
   - Ve a Propiedades de tu conexión Wi-Fi/Ethernet > IPv4.
   - Asigna una IP fija (ej: `192.168.1.100`) para que la app no pierda la conexión al reiniciar el router.
3. **Configurar Firewall:**
   - Abre el puerto **3000 (TCP)** en las "Reglas de Entrada" del Firewall de Windows para permitir que las tablets conecten.

### 2. Poner en marcha el Servidor

1. Entra en la carpeta `server/`.
2. Ejecuta `npm install`.
3. Inicia el servidor con persistencia:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "cima-server"
   pm2 save
   ```

### 3. Conectar la App al Servidor

1. Edita el archivo `constants/API.ts`.
2. Cambia la IP por la del servidor:
   ```typescript
   export const API_URL = 'http://192.168.1.100:3000/api';
   ```

### 4. Generar el APK e Instalar

1. Instala EAS CLI: `npm install -g eas-cli`.
2. Inicia sesión: `eas login`.
3. Genera el instalador:
   ```bash
   npx eas build -p android --profile preview
   ```
4. Descarga el archivo `.apk` e instálalo en todas las tablets.

---

## 🌐 ACCESO VERSIÓN WEB

Cualquier persona en la misma red local puede acceder a la aplicación desde un navegador (PC, Portátil, etc.) sin instalar nada.

### 1. Generar la Web (Una sola vez)
En la raíz del proyecto, ejecuta:
```bash
npx expo export --platform web
```
Esto creará una carpeta `dist/` con los archivos de la web.

### 2. Acceder
Una vez el servidor esté corriendo (`pm2 start index.js`), simplemente abre el navegador y escribe:
`http://[IP-DEL-SERVIDOR]:3000`

> [!TIP]
> La versión web utiliza la **misma base de datos** y el mismo panel de administración que las tablets, ya que ambas se conectan al mismo servidor Node.js.

---

## 🔄 ACTUALIZACIONES AUTOMÁTICAS (OTA)

Para enviar cambios a las tablets sin reinstalar el APK:

1. Ejecuta `eas update --branch production --message "Mejoras en UI"`.
2. Las tablets descargarán los cambios automáticamente al abrir la app (requiere internet momentáneo).

> [!WARNING]
> Los cambios en iconos, nombre de la app o nuevos permisos requieren generar un nuevo APK.

---

## 📱 Características Principales

- **Tienda Virtual:** Catálogo interactivo de productos con búsqueda y filtros.
- **Gestión de Pedidos:** Visualización y seguimiento de órdenes realizadas.
- **Panel de Administración:** Gestión de inventario, usuarios y configuración de correo (Gmail SMTP).
- **Carga de Imágenes:** Soporte para subir fotos de productos (Base64).

## 📂 Estructura del Proyecto

- `app/`: Rutas y pantallas (Expo Router).
- `server/`: Backend Node.js + base de datos SQLite.
- `components/`: Componentes UI reutilizables.
- `constants/`: Configuración global e IP del servidor.