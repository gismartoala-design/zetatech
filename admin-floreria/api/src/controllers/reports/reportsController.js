const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { format, startOfMonth, endOfMonth, startOfDay, endOfDay } = require('date-fns');
const { es } = require('date-fns/locale');

const prisma = new PrismaClient();

// Obtener datos del reporte
const getReportData = async (req, res) => {
  try {
    const { dateStart, dateEnd, range = 'this_month' } = req.query;
    let startDate, endDate;

    // Determinar rango de fechas
    if (range === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (range === 'this_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = startOfDay(new Date(now.setDate(diff)));
      endDate = endOfDay(new Date());
    } else if (range === 'this_month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else if (range === 'this_year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateStart && dateEnd) {
      startDate = startOfDay(new Date(dateStart));
      endDate = endOfDay(new Date(dateEnd));
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // Obtener órdenes en el rango
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        // Excluir órdenes de prueba
        AND: [
          {
            OR: [
              { orderNotes: null },
              {
                orderNotes: {
                  not: {
                    contains: 'prueba',
                  },
                },
              },
            ],
          },
          {
            OR: [
              { source: null },
              {
                source: {
                  not: 'test',
                },
              },
            ],
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estadísticas
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((acc, order) => acc + order.total, 0),
      totalTax: orders.reduce((acc, order) => acc + order.tax, 0),
      totalShipping: orders.reduce((acc, order) => acc + (order.shipping || 0), 0),
      subtotal: orders.reduce((acc, order) => acc + order.subtotal, 0),
      totalDiscount: orders.reduce((acc, order) => acc + order.total_discount_amount, 0),
      paidOrders: orders.filter(o => o.paymentStatus === 'SUCCEEDED').length,
      pendingOrders: orders.filter(o => o.paymentStatus === 'PENDING').length,
      cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
      deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
    };

    // Agrupar por estado de pago
    const byPaymentStatus = {
      succeeded: orders.filter(o => o.paymentStatus === 'SUCCEEDED'),
      pending: orders.filter(o => o.paymentStatus === 'PENDING'),
      failed: orders.filter(o => o.paymentStatus === 'FAILED'),
    };

    // Productos más vendidos
    const products = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productName = item.product?.name || 'Producto eliminado';
        if (!products[item.productId]) {
          products[item.productId] = {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
        }
        products[item.productId].quantity += item.quantity;
        products[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(products)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      period: {
        startDate: format(startDate, 'PPP', { locale: es }),
        endDate: format(endDate, 'PPP', { locale: es }),
        startDateISO: startDate.toISOString(),
        endDateISO: endDate.toISOString(),
      },
      stats,
      byPaymentStatus,
      topProducts,
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        customerName: `${order.customerName} ${order.customerLastName}`,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
        items: order.orderItems.map(item => ({
          name: item.product?.name || 'Producto eliminado',
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Error al obtener datos del reporte' });
  }
};

// Generar PDF del reporte
const generateReportPDF = async (req, res) => {
  try {
    const { dateStart, dateEnd, range = 'this_month' } = req.query;
    let startDate, endDate;

    // Determinar rango de fechas (mismo código que arriba)
    if (range === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (range === 'this_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = startOfDay(new Date(now.setDate(diff)));
      endDate = endOfDay(new Date());
    } else if (range === 'this_month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else if (range === 'this_year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateStart && dateEnd) {
      startDate = startOfDay(new Date(dateStart));
      endDate = endOfDay(new Date(dateEnd));
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // Obtener órdenes
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        AND: [
          {
            OR: [
              { orderNotes: null },
              {
                orderNotes: {
                  not: {
                    contains: 'prueba',
                  },
                },
              },
            ],
          },
          {
            OR: [
              { source: null },
              {
                source: {
                  not: 'test',
                },
              },
            ],
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `reporte_ventas_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Título
    doc.fontSize(24).font('Helvetica-Bold').text('REPORTE DE VENTAS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(
      `Período: ${format(startDate, 'PPP', { locale: es })} - ${format(endDate, 'PPP', { locale: es })}`,
      { align: 'center' }
    );
    doc.moveDown(1);

    // Estadísticas principales
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((acc, order) => acc + order.total, 0),
      totalTax: orders.reduce((acc, order) => acc + order.tax, 0),
      totalShipping: orders.reduce((acc, order) => acc + (order.shipping || 0), 0),
      totalDiscount: orders.reduce((acc, order) => acc + order.total_discount_amount, 0),
      paidOrders: orders.filter(o => o.paymentStatus === 'SUCCEEDED').length,
      pendingOrders: orders.filter(o => o.paymentStatus === 'PENDING').length,
    };

    doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN DE VENTAS', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de Órdenes: ${stats.totalOrders}`);
    doc.text(`Ingresos Totales: $${stats.totalRevenue.toFixed(2)}`);
    doc.text(`Subtotal: $${(stats.totalRevenue - stats.totalTax - stats.totalShipping + stats.totalDiscount).toFixed(2)}`);
    doc.text(`Impuestos: $${stats.totalTax.toFixed(2)}`);
    doc.text(`Envío: $${stats.totalShipping.toFixed(2)}`);
    doc.text(`Descuentos: $${stats.totalDiscount.toFixed(2)}`);
    doc.text(`Órdenes Pagadas: ${stats.paidOrders}`);
    doc.text(`Órdenes Pendientes: ${stats.pendingOrders}`);
    doc.moveDown(1);

    // Tabla de órdenes (primeras 20)
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DE ÓRDENES', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold');

    const tableTop = doc.y;
    const columnPositions = {
      number: 50,
      customer: 130,
      total: 320,
      status: 390,
      payment: 450,
      date: 520,
    };

    doc.text('Orden', columnPositions.number, tableTop);
    doc.text('Cliente', columnPositions.customer, tableTop);
    doc.text('Total', columnPositions.total, tableTop);
    doc.text('Estado', columnPositions.status, tableTop);
    doc.text('Pago', columnPositions.payment, tableTop);
    doc.text('Fecha', columnPositions.date, tableTop);

    const headerBottom = tableTop + 15;
    doc.moveTo(45, headerBottom).lineTo(565, headerBottom).stroke();
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(8);

    const displayedOrders = orders.slice(0, 20);
    displayedOrders.forEach(order => {
      const y = doc.y;
      if (y > 720) {
        doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Orden', columnPositions.number, doc.y);
        doc.text('Cliente', columnPositions.customer, doc.y);
        doc.text('Total', columnPositions.total, doc.y);
        doc.text('Estado', columnPositions.status, doc.y);
        doc.text('Pago', columnPositions.payment, doc.y);
        doc.text('Fecha', columnPositions.date, doc.y);
        doc.moveDown(0.8);
        doc.fontSize(8).font('Helvetica');
      }

      doc.text(order.orderNumber, columnPositions.number, doc.y, { width: 70 });
      doc.text(`${order.customerName}`.substring(0, 25), columnPositions.customer, doc.y, { width: 170 });
      doc.text(`$${order.total.toFixed(2)}`, columnPositions.total, doc.y, { width: 60 });
      doc.text(order.status.substring(0, 10), columnPositions.status, doc.y, { width: 50 });
      doc.text(order.paymentStatus.substring(0, 8), columnPositions.payment, doc.y, { width: 50 });
      doc.text(format(order.createdAt, 'dd/MM/yyyy'), columnPositions.date, doc.y, { width: 60 });
      doc.moveDown(0.9);
    });

    if (orders.length > 20) {
      doc.moveDown(0.3);
      doc.fontSize(8).text(`... y ${orders.length - 20} órdenes más`, { align: 'left' });
    }

    // Pie de página
    doc.moveDown(1);
    doc.fontSize(9).font('Helvetica-Oblique').text(
      `Reporte generado el ${format(new Date(), 'PPPppp', { locale: es })}`,
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

// Generar Excel del reporte
const generateReportExcel = async (req, res) => {
  try {
    const { dateStart, dateEnd, range = 'this_month' } = req.query;
    let startDate, endDate;

    // Determinar rango de fechas
    if (range === 'today') {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (range === 'this_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = startOfDay(new Date(now.setDate(diff)));
      endDate = endOfDay(new Date());
    } else if (range === 'this_month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else if (range === 'this_year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateStart && dateEnd) {
      startDate = startOfDay(new Date(dateStart));
      endDate = endOfDay(new Date(dateEnd));
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // Obtener órdenes
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        AND: [
          {
            OR: [
              { orderNotes: null },
              {
                orderNotes: {
                  not: {
                    contains: 'prueba',
                  },
                },
              },
            ],
          },
          {
            OR: [
              { source: null },
              {
                source: {
                  not: 'test',
                },
              },
            ],
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    
    // Hoja 1: Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((acc, order) => acc + order.total, 0),
      totalTax: orders.reduce((acc, order) => acc + order.tax, 0),
      totalShipping: orders.reduce((acc, order) => acc + (order.shipping || 0), 0),
      totalDiscount: orders.reduce((acc, order) => acc + order.total_discount_amount, 0),
      paidOrders: orders.filter(o => o.paymentStatus === 'SUCCEEDED').length,
      pendingOrders: orders.filter(o => o.paymentStatus === 'PENDING').length,
    };

    // Título
    summarySheet.mergeCells('A1:C1');
    summarySheet.getCell('A1').value = 'REPORTE DE VENTAS';
    summarySheet.getCell('A1').font = { bold: true, size: 16 };
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'center' };

    // Período
    summarySheet.mergeCells('A2:C2');
    summarySheet.getCell('A2').value = `Período: ${format(startDate, 'PPP', { locale: es })} - ${format(endDate, 'PPP', { locale: es })}`;
    summarySheet.getCell('A2').font = { size: 11 };
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };

    summarySheet.getCell('A4').value = 'Métrica';
    summarySheet.getCell('B4').value = 'Valor';
    summarySheet.getCell('A4').font = { bold: true };
    summarySheet.getCell('B4').font = { bold: true };
    summarySheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    summarySheet.getCell('B4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    let row = 5;
    summarySheet.getCell(`A${row}`).value = 'Total de Órdenes';
    summarySheet.getCell(`B${row}`).value = stats.totalOrders;
    row++;

    summarySheet.getCell(`A${row}`).value = 'Ingresos Totales';
    summarySheet.getCell(`B${row}`).value = stats.totalRevenue;
    summarySheet.getCell(`B${row}`).numFmt = '$#,##0.00';
    row++;

    summarySheet.getCell(`A${row}`).value = 'Subtotal';
    summarySheet.getCell(`B${row}`).value = stats.totalRevenue - stats.totalTax - stats.totalShipping + stats.totalDiscount;
    summarySheet.getCell(`B${row}`).numFmt = '$#,##0.00';
    row++;

    summarySheet.getCell(`A${row}`).value = 'Impuestos';
    summarySheet.getCell(`B${row}`).value = stats.totalTax;
    summarySheet.getCell(`B${row}`).numFmt = '$#,##0.00';
    row++;

    summarySheet.getCell(`A${row}`).value = 'Envío';
    summarySheet.getCell(`B${row}`).value = stats.totalShipping;
    summarySheet.getCell(`B${row}`).numFmt = '$#,##0.00';
    row++;

    summarySheet.getCell(`A${row}`).value = 'Descuentos';
    summarySheet.getCell(`B${row}`).value = stats.totalDiscount;
    summarySheet.getCell(`B${row}`).numFmt = '$#,##0.00';
    row++;

    summarySheet.getCell(`A${row}`).value = 'Órdenes Pagadas';
    summarySheet.getCell(`B${row}`).value = stats.paidOrders;
    row++;

    summarySheet.getCell(`A${row}`).value = 'Órdenes Pendientes';
    summarySheet.getCell(`B${row}`).value = stats.pendingOrders;

    summarySheet.columns = [
      { width: 30 },
      { width: 20 },
    ];

    // Hoja 2: Órdenes detalladas
    const ordersSheet = workbook.addWorksheet('Órdenes');
    
    ordersSheet.columns = [
      { header: 'Orden', key: 'orderNumber', width: 20 },
      { header: 'Cliente', key: 'customerName', width: 30 },
      { header: 'Email', key: 'customerEmail', width: 28 },
      { header: 'Teléfono', key: 'customerPhone', width: 18 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Envío', key: 'shipping', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Fecha', key: 'createdAt', width: 14 },
    ];

    // Header style - fondo azul oscuro, texto blanco y bold
    const headerRow = ordersSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    headerRow.height = 25;

    // Data rows
    orders.forEach((order, index) => {
      const row = ordersSheet.addRow({
        orderNumber: order.orderNumber,
        customerName: `${order.customerName} ${order.customerLastName}`,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        subtotal: order.subtotal,
        shipping: order.shipping || 0,
        total: order.total,
        createdAt: format(order.createdAt, 'dd/MM/yyyy'),
      });

      // Alternar colores de fila
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }

      // Alineación y formato
      row.alignment = { horizontal: 'left', vertical: 'center' };
      row.getCell('subtotal').alignment = { horizontal: 'right' };
      row.getCell('shipping').alignment = { horizontal: 'right' };
      row.getCell('total').alignment = { horizontal: 'right' };
    });

    // Format numbers as currency
    ordersSheet.getColumn('subtotal').numFmt = '$#,##0.00';
    ordersSheet.getColumn('shipping').numFmt = '$#,##0.00';
    ordersSheet.getColumn('total').numFmt = '$#,##0.00';

    // Bordes en todas las celdas
    for (let i = 1; i <= orders.length + 1; i++) {
      for (let j = 1; j <= 8; j++) {
        const cell = ordersSheet.getCell(i, j);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
      }
    }

    const filename = `reporte_ventas_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Error al generar el Excel' });
  }
};

module.exports = {
  getReportData,
  generateReportPDF,
  generateReportExcel,
};