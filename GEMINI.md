# MultiTablas Pro - Contexto del Proyecto

Este archivo proporciona una visión general y guías para trabajar en el proyecto **MultiTablas Pro**, una aplicación web educativa diseñada para ayudar a los usuarios a aprender y dominar las tablas de multiplicar de forma interactiva.

## 🚀 Descripción del Proyecto

**MultiTablas Pro** es una Single Page Application (SPA) moderna que utiliza un enfoque lúdico para la educación matemática. Permite a los usuarios estudiar tablas individuales, realizar cuestionarios personalizados, seguir su progreso y revisar su historial de desempeño.

### Tecnologías Principales
- **Framework:** React 19
- **Herramienta de Construcción:** Vite 6
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Animaciones:** Framer Motion (paquete `motion`)
- **Iconografía:** Lucide React
- **IA:** Google Generative AI SDK (`@google/genai`) - *Nota: Configurado pero no utilizado extensivamente en la lógica base visible.*

## 📂 Estructura de Archivos Clave

- `src/App.tsx`: Componente principal que contiene la lógica de estado global, navegación interna (modos) y las vistas de la aplicación.
- `src/types.ts`: Definiciones de interfaces y tipos para sesiones, errores y maestría.
- `src/constants.ts`: Constantes globales como tips de multiplicación y paletas de colores.
- `src/index.css`: Estilos globales y configuración de Tailwind.
- `vite.config.ts`: Configuración de Vite, incluyendo alias y plugins.

## 🛠️ Comandos de Desarrollo

| Comando | Descripción |
| :--- | :--- |
| `npm install` | Instala las dependencias del proyecto. |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000`. |
| `npm run build` | Compila la aplicación para producción en la carpeta `dist/`. |
| `npm run lint` | Ejecuta el chequeo de tipos con TypeScript. |
| `npm run preview` | Previsualiza la versión de producción localmente. |
| `npm run clean` | Elimina la carpeta de construcción `dist/`. |

## 💡 Convenciones de Desarrollo

1.  **Estado Global:** La aplicación utiliza `useState` y `useEffect` en `App.tsx` para gestionar el estado de la sesión actual y el historial. La persistencia se maneja mediante `localStorage`.
2.  **Estilizado:** Se prefiere el uso de clases utilitarias de Tailwind CSS directamente en los componentes. Los componentes de UI básicos (Card, Button) están definidos dentro de `App.tsx` para simplicidad en este prototipo.
3.  **Tipado:** Todas las interfaces nuevas deben definirse en `src/types.ts` para mantener la consistencia.
4.  **Animaciones:** Utilizar `AnimatePresence` y `motion` para transiciones suaves entre los diferentes modos de la aplicación (`HOME`, `QUIZ`, `LEARN`, etc.).
5.  **Internacionalización:** Actualmente la interfaz está en español. Mantener este idioma para consistencia.

## 🔑 Configuración

Para utilizar funcionalidades que requieran la API de Gemini, asegúrate de configurar tu clave en un archivo `.env.local`:
```env
GEMINI_API_KEY=tu_clave_aqui
```
