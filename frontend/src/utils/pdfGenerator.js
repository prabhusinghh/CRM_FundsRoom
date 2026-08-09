import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ───────────────────────────────────────────────
// Shared helpers
// ───────────────────────────────────────────────

const COLORS = {
  ink: [27, 36, 48],       // #1B2430
  kraft: [193, 121, 58],   // #C1793A
  canvas: [246, 243, 236], // #F6F3EC
  slate: [91, 107, 122],   // #5B6B7A
  depot: [63, 120, 89],    // #3F7859
  signal: [181, 67, 52],   // #B54334
  white: [255, 255, 255],
};

const COMPANY_NAME = 'FundsRoom ERP';
const COMPANY_TAGLINE = 'Wholesale & Distribution Operations';

function timestamp() {
  return new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Draw a standard branded header on the current page.
 * Returns the Y-coordinate after the header for content to start at.
 */
function drawHeader(doc, title) {
  const pageW = doc.internal.pageSize.getWidth();

  // Top bar
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 28, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text(COMPANY_NAME, 14, 14);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(COMPANY_TAGLINE, 14, 22);

  // Generated timestamp (right side)
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${timestamp()}`, pageW - 14, 22, { align: 'right' });

  // Document title below the bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.ink);
  doc.text(title, 14, 40);

  // Divider
  doc.setDrawColor(...COLORS.kraft);
  doc.setLineWidth(0.6);
  doc.line(14, 44, pageW - 14, 44);

  return 50; // starting Y for content
}

/**
 * Draw page numbers in the footer of every page.
 */
function addPageNumbers(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
    doc.text(COMPANY_NAME, 14, pageH - 8);
  }
}

// ───────────────────────────────────────────────
// 1. Challan PDF
// ───────────────────────────────────────────────

export function generateChallanPDF(challan) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = drawHeader(doc, 'Delivery Challan');

  // ── Challan number tag ──
  const tagText = ` ${challan.challan_number} `;
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  const tagW = doc.getTextWidth(tagText) + 8;
  doc.setDrawColor(...COLORS.kraft);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(14, y, tagW, 10, 2, 2, 'S');
  doc.setTextColor(...COLORS.ink);
  doc.text(tagText, 18, y + 7);
  doc.setLineDashPattern([], 0);

  // ── Status badge ──
  const statusColors = {
    Draft: COLORS.slate,
    Confirmed: COLORS.depot,
    Cancelled: COLORS.signal,
  };
  const statusColor = statusColors[challan.status] || COLORS.slate;
  const statusX = 14 + tagW + 8;
  doc.setFillColor(...statusColor);
  doc.roundedRect(statusX, y + 1, doc.getTextWidth(` ${challan.status} `) + 6, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text(challan.status, statusX + 3, y + 7);

  y += 20;

  // ── Info grid ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);

  const infoLeft = [
    ['Customer', challan.customer_name],
    ['Mobile', challan.customer_mobile || '—'],
    ['Created', new Date(challan.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })],
  ];
  if (challan.confirmed_at) {
    infoLeft.push(['Confirmed', new Date(challan.confirmed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })]);
  }

  infoLeft.forEach(([label, value], i) => {
    const row = y + i * 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate);
    doc.text(`${label}:`, 14, row);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.ink);
    doc.text(String(value), 50, row);
  });

  y += infoLeft.length * 7 + 8;

  // ── Items table ──
  const items = challan.items || [];
  const grandTotal = items.reduce((s, i) => s + Number(i.unit_price_snapshot) * i.quantity, 0);

  doc.autoTable({
    startY: y,
    head: [['#', 'Product', 'SKU', 'Unit Price (₹)', 'Qty', 'Subtotal (₹)']],
    body: items.map((item, idx) => [
      idx + 1,
      item.product_name_snapshot,
      item.product_sku_snapshot,
      Number(item.unit_price_snapshot).toFixed(2),
      item.quantity,
      (Number(item.unit_price_snapshot) * item.quantity).toFixed(2),
    ]),
    foot: [['', '', '', '', `${challan.total_quantity} units`, `₹${grandTotal.toFixed(2)}`]],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.ink,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.ink,
    },
    footStyles: {
      fillColor: COLORS.canvas,
      textColor: COLORS.ink,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Note about snapshots ──
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slate);
  doc.text(
    'Prices are snapshotted at the time this challan was created. Changes to live product prices do not affect this document.',
    14,
    y
  );
  y += 10;

  // ── Signature block ──
  const sigY = Math.max(y + 15, doc.internal.pageSize.getHeight() - 45);
  doc.setDrawColor(...COLORS.slate);
  doc.setLineWidth(0.3);

  // Left signature
  doc.line(14, sigY, 80, sigY);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate);
  doc.text('Authorized Signatory', 14, sigY + 5);

  // Right signature
  doc.line(pageW - 80, sigY, pageW - 14, sigY);
  doc.text('Received By', pageW - 80, sigY + 5);

  addPageNumbers(doc);
  doc.save(`${challan.challan_number}.pdf`);
}

// ───────────────────────────────────────────────
// 2. Product / Inventory Report PDF
// ───────────────────────────────────────────────

export function generateProductStockPDF(products) {
  const doc = new jsPDF('landscape');
  let y = drawHeader(doc, 'Inventory & Stock Report');

  // Summary stats
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + Number(p.current_stock), 0);
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_alert).length;
  const totalValue = products.reduce((s, p) => s + Number(p.unit_price) * Number(p.current_stock), 0);

  const stats = [
    { label: 'Total Products', value: totalProducts, color: COLORS.ink },
    { label: 'Total Stock Units', value: totalStock.toLocaleString(), color: COLORS.depot },
    { label: 'Low Stock Alerts', value: lowStockCount, color: COLORS.signal },
    { label: 'Inventory Value', value: `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: COLORS.kraft },
  ];

  const cardW = 60;
  const cardGap = 8;
  const startX = 14;
  stats.forEach((s, i) => {
    const x = startX + i * (cardW + cardGap);
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.white);
    doc.text(String(s.value), x + 4, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(s.label, x + 4, y + 14);
  });

  y += 28;

  // Table
  doc.autoTable({
    startY: y,
    head: [['#', 'Product Name', 'SKU', 'Category', 'Location', 'Unit Price (₹)', 'Stock', 'Min Alert', 'Status']],
    body: products.map((p, idx) => {
      const isLow = p.current_stock <= p.min_stock_alert;
      return [
        idx + 1,
        p.name,
        p.sku,
        p.category || '—',
        p.warehouse_location || '—',
        Number(p.unit_price).toFixed(2),
        p.current_stock,
        p.min_stock_alert,
        isLow ? '⚠ LOW' : 'OK',
      ];
    }),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.ink,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.ink,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === '⚠ LOW') {
          data.cell.styles.textColor = COLORS.signal;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = COLORS.depot;
        }
      }
    },
  });

  addPageNumbers(doc);
  doc.save(`Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ───────────────────────────────────────────────
// 3. Customer Report PDF
// ───────────────────────────────────────────────

export function generateCustomerReportPDF(customers) {
  const doc = new jsPDF('landscape');
  let y = drawHeader(doc, 'Customer Directory Report');

  // Summary cards
  const totalCustomers = customers.length;
  const leads = customers.filter((c) => c.status === 'Lead').length;
  const active = customers.filter((c) => c.status === 'Active').length;
  const inactive = customers.filter((c) => c.status === 'Inactive').length;

  const stats = [
    { label: 'Total Customers', value: totalCustomers, color: COLORS.ink },
    { label: 'Active', value: active, color: COLORS.depot },
    { label: 'Leads', value: leads, color: COLORS.kraft },
    { label: 'Inactive', value: inactive, color: COLORS.signal },
  ];

  const cardW = 60;
  const cardGap = 8;
  const startX = 14;
  stats.forEach((s, i) => {
    const x = startX + i * (cardW + cardGap);
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.white);
    doc.text(String(s.value), x + 4, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(s.label, x + 4, y + 14);
  });

  y += 28;

  doc.autoTable({
    startY: y,
    head: [['#', 'Name', 'Business', 'Mobile', 'Email', 'Type', 'Status', 'Follow-up Date']],
    body: customers.map((c, idx) => [
      idx + 1,
      c.name,
      c.business_name || '—',
      c.mobile,
      c.email || '—',
      c.customer_type,
      c.status,
      c.follow_up_date || '—',
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.ink,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.ink,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 244],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        if (val === 'Active') data.cell.styles.textColor = COLORS.depot;
        else if (val === 'Lead') data.cell.styles.textColor = COLORS.kraft;
        else if (val === 'Inactive') data.cell.styles.textColor = COLORS.signal;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addPageNumbers(doc);
  doc.save(`Customer_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
