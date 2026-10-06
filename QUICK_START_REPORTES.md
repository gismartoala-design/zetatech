# 🚀 QUICK START - Reportes de Ventas

## 1️⃣ Verificar que los Servidores Estén Corriendo

### API (Puerto 4000)
```bash
cd admin-floreria/api
npm run dev
```
✅ Espera a ver: `🚀 Servidor ejecutándose en http://0.0.0.0:4000`

### Cliente (Puerto 5173 o 5174)
```bash
cd admin-floreria/client
npm run dev
```
✅ Espera a ver: `➜ Local: http://localhost:5173/` (o 5174)

---

## 2️⃣ Acceder al Admin

1. Abre tu navegador: `http://localhost:5173` (o 5174)
2. Inicia sesión si no lo has hecho
3. En el menú lateral, busca **"Reportes"**
4. ¡Haz clic para abrir el módulo!

---

## 3️⃣ Usar el Módulo de Reportes

### Opción A: Ver Este Mes (por defecto)
1. La página carga automáticamente el reporte de **este mes**
2. ¡Ya ves las estadísticas!

### Opción B: Cambiar Período
1. En el dropdown "Período" elige:
   - **Hoy** → Solo órdenes de hoy
   - **Esta semana** → Últimos 7 días
   - **Este mes** → Del 1 al último día del mes
   - **Este año** → Todo el año
   - **Fechas personalizadas** → Elige rango libre

2. El reporte se actualiza automáticamente

### Opción C: Descargar PDF
1. Selecciona el período que desees
2. Haz clic en el botón **"Descargar PDF"**
3. ¡Se descarga el PDF profesional!

---

## 4️⃣ Entender las Estadísticas

### Tarjetas Principales
```
┌─────────────────────────────────────────────────┐
│ 📊 Total de Órdenes      │ 45                  │
│ 💰 Ingresos Totales      │ $12,500.50          │
│ 📉 Descuentos            │ $250.00             │
│ ✅ Órdenes Pagadas       │ 35 (77%)            │
│ ⏳ Órdenes Pendientes    │ 8 (17%)             │
│ ❌ Órdenes Canceladas    │ 2 (4%)              │
│ 🚚 Órdenes Entregadas   │ 30 (66%)            │
│ 🏦 Impuestos + Envío     │ $1,750.05           │
└─────────────────────────────────────────────────┘
```

### Top 10 Productos
Ver qué productos vendieron más:
```
1. Ramo de Rosas Rojas         - 120 unidades - $3,600
2. Arreglo de Girasoles        - 95 unidades - $2,850
3. Ramo Personalizado          - 85 unidades - $2,550
... etc
```

### Tabla de Órdenes
Ver todas las órdenes del período con:
- Número de orden (ej: ORD-0001)
- Cliente
- Total
- Estado (Entregado, Pendiente, etc.)
- Tipo de pago (Pagado, Pendiente, Fallido)

---

## 5️⃣ Descargar PDF

El PDF incluye:
- ✅ Resumen ejecutivo
- ✅ Tabla de estadísticas principales
- ✅ Top 10 productos más vendidos
- ✅ Primeras 20 órdenes en detalle
- ✅ Fecha y hora de generación
- ✅ Formato profesional listo para imprimir

---

## 6️⃣ Casos de Uso Comunes

### 📈 Reporte Diario de Ventas
1. Cada mañana entra a `/app/reports`
2. Selecciona "Hoy"
3. ¡Ves qué vendiste ayer!

### 📊 Reporte Semanal
1. Selecciona "Esta semana"
2. Descarga el PDF
3. Comparte con el equipo

### 📅 Comparar Períodos
1. Genera reporte del mes actual
2. Anota los números
3. Genera reporte del mes pasado
4. Compara resultados

### 🎯 Identificar Top Productos
1. Ve a la sección "Top Productos"
2. Identifica qué vende mejor
3. Ajusta tu inventario/marketing

### 🔍 Auditar Órdenes
1. Abre la tabla de órdenes
2. Búsqueda por estado de pago
3. Investiga órdenes pendientes o fallidas

---

## 7️⃣ Solucionar Problemas

### "No aparecen órdenes"
✅ Verifica que haya órdenes en ese período
✅ Asegúrate de no tener TODAS órdenes marcadas como "prueba"

### "El PDF no se descarga"
✅ Comprueba que tengas conexión a internet
✅ Intenta en otro navegador
✅ Limpia el cache

### "Error de autenticación"
✅ Inicia sesión de nuevo
✅ Verifica que el token sea válido

### "Las cifras parecen incorrectas"
✅ Comprueba el período seleccionado
✅ Verifica que las órdenes de prueba estén excluidas

---

## 8️⃣ Características Especiales

### 🎨 Colores Significativos
- 🟢 **Verde** = Órdenes pagadas, entregadas
- 🟡 **Amarillo** = Órdenes pendientes
- 🔴 **Rojo** = Órdenes canceladas
- 🔵 **Azul** = Información general

### 📱 Responsivo
- Funciona en desktop, tablet y móvil
- Los filtros se ajustan al tamaño
- Las tablas se hacen scroll en móvil

### ⚡ Auto-Actualización
- Cuando cambias filtros, se recarga automáticamente
- No necesitas hacer refresh manual

### 🛡️ Seguridad
- Requiere estar logueado
- Solo ve datos de tu empresa
- Los datos se calculan en tiempo real

---

## 9️⃣ Atajos Útiles

```
🔗 Ir a Reportes:           http://localhost:5173/app/reports
📊 Ver datos JSON:          http://localhost:4000/api/reports/data?range=this_month
📄 Descargar PDF directo:   http://localhost:4000/api/reports/pdf?range=this_month
```

---

## 🔟 Próximos Pasos (Opcional)

- 📧 Configura reportes automáticos por email
- 📈 Agrega gráficos de tendencias
- 📊 Exporta a Excel
- 🔔 Recibe alertas de ventas bajas
- 🎯 Segmenta por producto/cliente

---

## 🎯 Resumen

| Acción | URL | Tecla |
|--------|-----|-------|
| Abrir reportes | `/app/reports` | Click en "Reportes" |
| Cambiar período | Dropdown arriba | Select un período |
| Descargar PDF | Botón "Descargar PDF" | Click |
| Ver top productos | Scroll abajo | Aparece automático |
| Ver todas las órdenes | Tabla abajo | Ver listado |

---

## ¿Preguntas?

- 📖 Lee `REPORTES_IMPLEMENTACION.md` para detalles técnicos
- 🔌 Lee `API_REPORTES_EJEMPLOS.md` para ejemplos de API
- ✅ Revisa `CHECKLIST_IMPLEMENTACION.md` para completitud

---

**¡Listo! Ya puedes generar tus reportes de ventas 🎉**
