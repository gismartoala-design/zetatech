# 🔌 API de Reportes - Ejemplos de Uso

## Endpoints Disponibles

### 1. Obtener Datos del Reporte
```
GET /api/reports/data?range={range}&dateStart={fecha}&dateEnd={fecha}
```

**Parámetros:**
- `range` (obligatorio): `today`, `this_week`, `this_month`, `this_year`, `custom`
- `dateStart` (si range=custom): `YYYY-MM-DD`
- `dateEnd` (si range=custom): `YYYY-MM-DD`

**Autenticación:** Requiere token JWT en cookies

---

## 📡 Ejemplos cURL

### Ejemplo 1: Reporte de Este Mes
```bash
curl -X GET "http://localhost:4000/api/reports/data?range=this_month" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Ejemplo 2: Reporte de Hoy
```bash
curl -X GET "http://localhost:4000/api/reports/data?range=today" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Ejemplo 3: Reporte con Fechas Personalizadas
```bash
curl -X GET "http://localhost:4000/api/reports/data?range=custom&dateStart=2026-05-01&dateEnd=2026-05-31" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## 📄 Descargar PDF

### Endpoint
```
GET /api/reports/pdf?range={range}&dateStart={fecha}&dateEnd={fecha}
```

**Parámetros:** Iguales al endpoint de datos

**Retorna:** Archivo PDF descargable

### Ejemplo con cURL
```bash
curl -X GET "http://localhost:4000/api/reports/pdf?range=this_month" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -o reporte_ventas.pdf
```

### Ejemplo con JavaScript/Fetch
```javascript
const downloadReport = async (range) => {
  const response = await fetch(
    `/api/reports/pdf?range=${range}`,
    { credentials: 'include' }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

// Usar:
downloadReport('this_month');
```

---

## 📊 Respuesta JSON - Estructura Completa

```json
{
  "period": {
    "startDate": "1 de mayo de 2026",
    "endDate": "31 de mayo de 2026",
    "startDateISO": "2026-05-01T00:00:00.000Z",
    "endDateISO": "2026-05-31T23:59:59.000Z"
  },
  "stats": {
    "totalOrders": 45,
    "totalRevenue": 12500.50,
    "totalTax": 1250.05,
    "totalShipping": 500.00,
    "subtotal": 10750.45,
    "totalDiscount": 250.00,
    "paidOrders": 35,
    "pendingOrders": 8,
    "cancelledOrders": 2,
    "deliveredOrders": 30
  },
  "byPaymentStatus": {
    "succeeded": [...],    // Array de órdenes pagadas
    "pending": [...],      // Array de órdenes pendientes
    "failed": [...]        // Array de órdenes fallidas
  },
  "topProducts": [
    {
      "name": "Ramo de Rosas Rojas",
      "quantity": 120,
      "revenue": 3600.00
    },
    {
      "name": "Arreglo de Girasoles",
      "quantity": 95,
      "revenue": 2850.00
    }
    // ... más productos
  ],
  "orders": [
    {
      "orderNumber": "ORD-001",
      "customerName": "Juan García",
      "customerEmail": "juan@example.com",
      "customerPhone": "+57 123 456 789",
      "total": 250.00,
      "subtotal": 225.00,
      "tax": 22.50,
      "shipping": 0.00,
      "paymentStatus": "SUCCEEDED",
      "status": "DELIVERED",
      "createdAt": "2026-05-05T10:30:00Z",
      "items": [
        {
          "name": "Ramo Premium",
          "quantity": 1,
          "price": 225.00
        }
      ]
    }
    // ... más órdenes
  ]
}
```

---

## 🧪 Testing con Postman

### 1. Set Environment Variable
```
Variable: token
Value: [Tu JWT Token]
```

### 2. GET - Reporte Este Mes
```
Method: GET
URL: http://localhost:4000/api/reports/data?range=this_month
Headers:
  - Cookie: token={{token}}
```

### 3. GET - Descargar PDF
```
Method: GET
URL: http://localhost:4000/api/reports/pdf?range=this_month
Headers:
  - Cookie: token={{token}}
```

---

## 🔒 Autenticación

Todos los endpoints requieren **autenticación con JWT**.

El token se envía automáticamente en cookies si:
1. Estás logueado en el admin
2. El navegador envía las cookies con `credentials: 'include'`

Si usas cURL o herramientas sin cookies, agrega:
```bash
-H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## ⚠️ Errores Comunes

### 401 Unauthorized
```json
{
  "error": "Autenticación requerida"
}
```
**Solución:** Inicia sesión en el admin primero

### 400 Bad Request
```json
{
  "error": "Error al obtener datos del reporte"
}
```
**Solución:** Verifica los parámetros de fecha en formato YYYY-MM-DD

### 500 Internal Server Error
```
Error fetching report data: [mensaje de error]
```
**Solución:** Verifica los logs del API server

---

## 📈 Casos de Uso

### Reporte Diario
```javascript
// Cada mañana a las 8am
setInterval(() => {
  fetchReportData('today');
}, 24 * 60 * 60 * 1000);
```

### Exportación Semanal en PDF
```javascript
const exportWeeklyReport = async () => {
  await downloadReport('this_week');
  console.log('Reporte semanal descargado');
};

// Ejecutar cada lunes
```

### Dashboard en Tiempo Real
```javascript
const { reportData, fetchReport } = useReports();

useEffect(() => {
  // Recargar cada 5 minutos
  const interval = setInterval(
    () => fetchReport({ range: 'today' }),
    5 * 60 * 1000
  );
  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Filtrado de Órdenes de Prueba

El API **automáticamente excluye**:

```javascript
// Órdenes donde orderNotes contiene "prueba"
// Órdenes donde source = "test"
```

Para marcar una orden como prueba:
```sql
UPDATE orders 
SET orderNotes = 'prueba - test' 
WHERE id = 'order_id';
```

---

## 📚 Integración Frontend

Ya está implementado en el hook `useReports`:

```typescript
const { reportData, isLoading, error, filters, fetchReport, downloadPDF } = useReports();

// Cargar reporte
await fetchReport({ range: 'this_month' });

// Descargar PDF
await downloadPDF({ range: 'this_month' });
```

---

## 🚀 Performance

- **Caché:** Los datos se calculan en tiempo real
- **Tiempo de respuesta:** ~200-500ms dependiendo de cantidad de órdenes
- **Límite de órdenes:** Sin límite técnico, pero PDF muestra primeras 20

Para mejorar performance con muchas órdenes:
```javascript
// Agregar índices en BD
CREATE INDEX idx_orders_created_at ON orders(createdAt);
CREATE INDEX idx_orders_payment_status ON orders(paymentStatus);
CREATE INDEX idx_order_items_order_id ON order_items(orderId);
```

---

¡Listo para usar! 🎉
