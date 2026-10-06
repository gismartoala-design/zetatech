# 📊 Sistema de Reportes de Ventas - Guía de Implementación

## ✅ Resumen de Cambios Realizados

He implementado un **módulo completo de reportes de ventas** con interfaz web, filtros avanzados y generación de PDFs. Aquí está todo lo que fue agregado:

---

## 🎯 Características Principales

### 1. **Filtros de Fecha Flexible**
- ✅ Hoy
- ✅ Esta semana
- ✅ Este mes
- ✅ Este año
- ✅ Fechas personalizadas (rango libre)

### 2. **Estadísticas Detalladas**
- Total de órdenes
- Ingresos totales
- Desglose por estado de pago (Pagado, Pendiente, Fallido)
- Órdenes entregadas, canceladas, pendientes
- Top 10 productos más vendidos
- Totales de impuestos y envío

### 3. **Generación de PDF**
- Descarga directa desde la interfaz
- Incluye todas las estadísticas
- Tabla con primeras 20 órdenes
- Top 10 productos
- Formato profesional en español

### 4. **Tabla Interactiva**
- Vista de todas las órdenes en el período
- Búsqueda, estado, información de cliente
- Badges de color para estados

---

## 📁 Archivos Creados - BACKEND (API)

### Controlador
```
admin-floreria/api/src/controllers/reports/reportsController.js
```
**Funciones:**
- `getReportData()` - Obtiene datos del reporte con filtros
- `generateReportPDF()` - Genera PDF descargable

### Rutas
```
admin-floreria/api/src/routes/reports/index.js
```
- `GET /api/reports/data` - Obtiene datos JSON del reporte
- `GET /api/reports/pdf` - Descarga PDF

### Configuración
Se agregó la ruta en `admin-floreria/api/src/index.js`:
```javascript
const reportsRoutes = require("./routes/reports/index");
app.use("/api/reports", authMiddleware, reportsRoutes);
```

### Dependencias Instaladas
```bash
npm install pdfkit date-fns
```

---

## 📁 Archivos Creados - FRONTEND (Cliente)

### Tipos TypeScript
```
admin-floreria/client/src/features/reports/types/reports.ts
```

### Servicio API
```
admin-floreria/client/src/features/reports/api/reports-service.ts
```
- Funciones para consumir el API
- Descarga de PDFs

### Hook Personalizado
```
admin-floreria/client/src/features/reports/hooks/useReports.ts
```
- Manejo de estado del reporte
- Carga de datos
- Descarga de PDF

### Componentes React
```
admin-floreria/client/src/features/reports/components/
├── ReportFilters.tsx       # Selector de filtros y botón de descarga
├── ReportStats.tsx         # Tarjetas con estadísticas
├── ReportTable.tsx         # Tabla de órdenes
├── TopProductsCard.tsx     # Top 10 productos
└── SalesReportsPage.tsx    # Página principal
```

### Página de Rutas
```
admin-floreria/client/src/features/reports/pages/reports-page.tsx
```

### Navegación
Se actualizó `admin-floreria/client/src/shared/components/layout/app-sidebar.tsx`:
- Agregado icono `IconChart` de Tabler
- Nuevo item en navegación: "Reportes" → `/app/reports`

### Actualización de Rutas
Se agregó la ruta en `admin-floreria/client/src/app/routes.tsx`:
```typescript
const ReportsPage = lazy(() => import("@/features/reports/pages/reports-page"));
// ...
{
  path: "reports",
  element: (
    <Suspense fallback={<Loading />}>
      <ReportsPage />
    </Suspense>
  ),
}
```

---

## 🚀 Cómo Usar

### Acceder al Módulo
1. Inicia sesión en el admin dashboard
2. En el menú lateral, haz clic en **"Reportes"**
3. Se abrirá la página `/app/reports`

### Generar un Reporte

**Paso 1: Seleccionar Período**
- Usa el dropdown "Período" para elegir:
  - Hoy
  - Esta semana
  - Este mes
  - Este año
  - Fechas personalizadas (aquí selecciona inicio y fin)

**Paso 2: Ver Estadísticas**
- Se cargan automáticamente después de 0.5 segundos
- Ver tarjetas con KPIs principales

**Paso 3: Descargar PDF**
- Haz clic en "Descargar PDF"
- Se genera y descarga un PDF profesional con:
  - Resumen de ventas
  - Top 10 productos
  - Detalle de primeras 20 órdenes

**Paso 4: Explorar Datos**
- Scroll hacia abajo para ver:
  - Top 10 productos más vendidos
  - Tabla completa de todas las órdenes del período

---

## 📊 Datos Mostrados en el Reporte

### Resumen (Tarjetas)
```
├─ Total de Órdenes
├─ Ingresos Totales (con subtotal)
├─ Descuentos aplicados
├─ Órdenes Pagadas (%)
├─ Órdenes Pendientes (%)
├─ Órdenes Canceladas
├─ Órdenes Entregadas (%)
└─ Impuestos y Envío
```

### Top Productos
```
Ranking con:
├─ Nombre del producto
├─ Cantidad vendida
└─ Ingresos generados
```

### Tabla de Órdenes
```
├─ Número de orden
├─ Cliente
├─ Email
├─ Total
├─ Estado (PENDING, CONFIRMED, PREPARING, READY, DELIVERED)
├─ Estado de pago (SUCCEEDED, PENDING, FAILED)
└─ Fecha
```

---

## 🔧 Filtros de API

### Parámetros Soportados
```
GET /api/reports/data?range=this_month
GET /api/reports/data?range=custom&dateStart=2026-05-01&dateEnd=2026-05-15
GET /api/reports/pdf?range=today
```

**Valores de `range`:**
- `today` - Hoy
- `this_week` - Esta semana
- `this_month` - Este mes (por defecto)
- `this_year` - Este año
- `custom` - Rango personalizado (requiere `dateStart` y `dateEnd`)

**Formato de fechas:** `YYYY-MM-DD`

---

## 🛡️ Exclusión de Órdenes de Prueba

El sistema **automáticamente excluye**:
- Órdenes con `orderNotes` que contengan "prueba"
- Órdenes con `source = "test"`

Esto asegura que solo se muestren órdenes reales.

---

## 📦 Dependencias Agregadas

### Backend
```json
{
  "pdfkit": "^0.13.0",
  "date-fns": "^3.x.x"
}
```

### Frontend
```json
{
  "date-fns": "^3.x.x"
}
```

---

## 🎨 Interfaz Visual

- **Diseño Responsivo:** Funciona en desktop y mobile
- **Tema:** Sigue el design system existente (shadcn/ui)
- **Colores:** 
  - Verde: Órdenes pagadas
  - Amarillo: Pendientes
  - Rojo: Canceladas
  - Azul: General
- **Iconos:** Tabler icons (coherente con el admin)

---

## 📝 Notas Técnicas

### Estructura de Datos
```typescript
interface SalesReportData {
  period: { startDate, endDate, startDateISO, endDateISO }
  stats: ReportStats
  byPaymentStatus: { succeeded, pending, failed }
  topProducts: TopProduct[]
  orders: ReportOrder[]
}
```

### Flujo de Datos
1. Usuario selecciona filtros
2. `useReports` hook construye query params
3. `reports-service` llama a `/api/reports/data`
4. API consulta BD con Prisma
5. Excluye órdenes de prueba
6. Calcula estadísticas
7. Retorna JSON a frontend
8. Componentes renderizan datos

### PDF Generation
- Usa `pdfkit` (librería Node.js para PDFs)
- Se genera en el servidor y se descarga
- Formato A4 con márgenes estándar
- Tabla de órdenes con primeras 20 filas

---

## ✨ Funcionalidades Futuras (Opcionales)

Si quieres expandir este módulo:
- ✅ Exportar a Excel (ya está el script base)
- ✅ Gráficos de tendencias (Recharts ya está en el proyecto)
- ✅ Segmentación por cliente
- ✅ Análisis de productos
- ✅ Reportes programados por email

---

## 🐛 Troubleshooting

### "Error al obtener datos del reporte"
- Verifica que el API esté corriendo en puerto 4000
- Comprueba que estés autenticado (token válido)

### "Error al descargar el PDF"
- El servidor debe tener permisos de escritura en `/tmp` (Linux) o `%TEMP%` (Windows)
- Verifica que `pdfkit` esté instalado

### Órdenes no aparecen
- Verifica que existan órdenes en la BD en el período
- Asegúrate de que no sean todas órdenes de prueba

---

## 📞 Resumen

✅ Sistema completo de reportes implementado  
✅ Interfaz intuitiva con filtros flexibles  
✅ Generación de PDFs profesionales  
✅ Datos en tiempo real desde BD  
✅ Excluye órdenes de prueba automáticamente  
✅ Integrado en navegación del admin  

**¡Listo para usar!** 🎉
