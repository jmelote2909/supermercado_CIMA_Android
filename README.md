# Supermercado CIMA (Android) 🛒

Esta es la aplicación móvil oficial del **Supermercado CIMA**, desarrollada con [Expo](https://expo.dev) y [React Native](https://reactnative.dev/). La aplicación permite a los usuarios navegar por el catálogo de productos, realizar pedidos y gestionar sus compras de manera eficiente.

## 🚀 Tecnologías Utilizadas

- **Core:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction) (Basada en archivos)
- **Backend/Base de Datos:** [Firebase](https://firebase.google.com/)
- **Estilos:** Expo Linear Gradient & Vector Icons
- **Estado y Efectos:** React Hooks (useState, useEffect)

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/jmelote2909/supermercado_CIMA_Android.git
   cd supermercado_CIMA_Android
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación:**
   ```bash
   npx expo start
   ```

Desde la terminal de Expo, puedes presionar `a` para abrir en un emulador de Android o escanear el código QR con la app **Expo Go** en tu dispositivo físico.

## 📱 Características Principales

- **Tienda Virtual:** Catálogo interactivo de productos con búsqueda y filtros.
- **Gestión de Pedidos:** Visualización y seguimiento de órdenes realizadas.
- **Panel de Administración:** Gestión de inventario, pedidos y configuraciones del sistema (accesible vía `admin.tsx`).
- **Carga de Imágenes:** Soporte para subir fotos de productos mediante `expo-image-picker`.

## 📂 Estructura del Proyecto

- `app/`: Contiene las rutas y pantallas principales de la aplicación (usando Expo Router).
  - `(tabs)/`: Navegación principal por pestañas (Tienda, Pedidos).
  - `admin.tsx`: Panel administrativo.
- `components/`: Componentes de UI reutilizables.
- `constants/`: Valores constantes como colores, estilos y configuraciones.
- `hooks/`: Custom hooks para lógica compartida.
- `assets/`: Imágenes, fuentes y otros recursos estáticos.

## 📄 Licencia

Este proyecto es privado y propiedad de Supermercado CIMA.

---
Desarrollado con ❤️ por el equipo de Supermercado CIMA.
