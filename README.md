# 🌿 Banco Agrario – Sistema de Gestión de Capacidad de Recursos

## 📘 Descripción General
Este proyecto forma parte del reto empresarial propuesto por el **Banco Agrario de Colombia** en colaboración con la **Universidad del Rosario**.  
El objetivo es desarrollar una **aplicación web interna** que permita **gestionar las capacidades y asignaciones** de los colaboradores de la Jefatura de Creación de Valor, mejorando la eficiencia en la planeación de recursos y la toma de decisiones basadas en datos.x

La solución actual corresponde al **frontend funcional**, implementado con React, TailwindCSS y Zustand, y preparada para conectarse con un backend en desarrollo basado en FastAPI y MySQL.

---

## 🧩 Características Principales
- **Vista de Capacidad de Recursos:** muestra la carga y disponibilidad de cada colaborador mediante anillos de progreso interactivos.  
- **Vista Recursos vs Proyecto:** tabla cruzada que relaciona proyectos y recursos con porcentajes de dedicación.  
- **Vista de Proyectos:** lista consolidada con fechas, personas asignadas y progreso global.  
- **Filtros dinámicos:** búsqueda por proyecto, recurso, área, tipo o clasificación.  
- **Actualización instantánea:** los cambios se reflejan en todas las vistas gracias al estado global de la aplicación.  
- **Diseño institucional:** paleta y tipografía adaptadas a la identidad visual del Banco Agrario.  

---
## 🛠️ Tecnologías Utilizadas

| Área | Herramienta | Descripción |
|------|--------------|-------------|
| **Frontend** | **React + Vite** | Framework para componentes dinámicos con servidor de desarrollo rápido. |
| **Estilos** | **Tailwind CSS v4** | Sistema de diseño modular con tokens personalizados (colores institucionales). |
| **Estado global** | **Zustand** | Manejo centralizado y reactivo de datos. |
| **Ruteo** | **React Router** | Navegación entre vistas sin recargar la página. |
| **Fechas** | **date-fns** | Cálculo de semanas, horizontes y duraciones. |
| **Gráficos** | **Chart.js / D3.js** | Visualización de datos numéricos y mapas de calor. |
| **Arrastre** | **@dnd-kit** | Interacciones “drag & drop” en vistas dinámicas. |
| **Backend (en desarrollo)** | **FastAPI + MySQL (RDS)** | Gestión de datos, API REST y persistencia. |
| **Despliegue previsto** | **AWS S3 + EKS** | Infraestructura escalable y segura. |

---
## 🚀 Instalación y Ejecución

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/<usuario>/<repositorio>.git
cd banco-agrario-frontend
```
### 2️⃣ Instalar las dependencias
```
npm install
```
### 3️⃣ Ejecutar en modo desarrollo
```
npm run dev
```
