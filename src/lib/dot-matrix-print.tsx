import type { Invoice } from "@/types/invoice.types"
import type { Delivery } from "@/types/delivery.types"
import type { SalesOrder } from "@/types/sales-order.types"


export const DOT_MATRIX_OUTLET = {
  name: "Mecca Ranaya Atelier",
  legalName: "PT MECCA DISTRIBUSI SOLUSINDO",
  addressLines: [
    "Jalan Lenteng Agung Raya,",
    "Lenteng Agung, Jagakarsa,",
    "Jakarta Selatan, Daerah",
    "Khusus Ibukota Jakarta,",
    "Jawa, 12530, Indonesia",
  ],
  email: "ptmeccaranayaatelier@gmail.com",
  phone: "087789910979",
  banks: [
    {
      bank: "Bank Mandiri",
      accountNo: "127-00-0806202-6",
      accountName: "PT Mecca Ranaya Atelier",
    },
    {
      bank: "Bank BCA",
      accountNo: "7332200022",
      accountName: "PT Mecca Ranaya Atelier",
    },
  ],
  npwp: "1000000009998558",
}

export function formatDotMatrixDate(dateStr?: string | Date): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]
  const day = String(d.getDate()).padStart(2, "0")
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${day} ${month} ${year} ${hours}:${minutes}`
}

export function formatDotMatrixDateOnly(dateStr?: string | Date): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]
  const day = String(d.getDate()).padStart(2, "0")
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function formatDotMatrixCurrency(val: number | string | undefined | null, includeDecimals = true): string {
  const num = Number(val) || 0
  if (num === 0) return "Rp 0"
  const formatted = num.toLocaleString("id-ID", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `Rp ${formatted}`
}

export function formatDotMatrixAmount(val: number | string | undefined | null, includeDecimals = true): string {
  const num = Number(val) || 0
  if (num === 0) return "0"
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

export const DOT_MATRIX_STYLES_CSS = `
  .dm-container {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    background: #fff;
    color: #000;
    font-family: 'Courier New', Courier, monospace;
    font-weight: 700;
    font-size: 11px;
    line-height: 1.25;
    padding: 10px;
  }
  .dm-header-table {
    width: 100%;
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .dm-header-meta-col {
    padding: 6px 12px;
    vertical-align: top;
    border-right: 1.5px solid #000;
  }
  .dm-meta-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }
  .dm-meta-value {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }
  .dm-header-title-col {
    padding: 6px 14px;
    text-align: right;
    vertical-align: middle;
    font-size: 21px;
    font-weight: 700;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .dm-info-grid {
    display: table;
    width: 100%;
    margin-bottom: 12px;
  }
  .dm-info-row {
    display: table-row;
  }
  .dm-outlet-col {
    display: table-cell;
    width: 38%;
    vertical-align: top;
    font-size: 11px;
    line-height: 1.35;
    padding-right: 12px;
  }
  .dm-customer-col {
    display: table-cell;
    width: 35%;
    vertical-align: top;
    font-size: 11px;
    line-height: 1.35;
    padding-right: 12px;
  }
  .dm-total-box-col {
    display: table-cell;
    width: 27%;
    vertical-align: middle;
    border: 1.5px solid #000;
    text-align: center;
    padding: 16px 8px;
  }
  .dm-col-heading {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .dm-box-total-label {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: 1px;
  }
  .dm-box-total-amount {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .dm-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    page-break-inside: auto;
  }
  .dm-items-table th {
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    padding: 6px 4px;
    font-size: 11px;
    font-weight: 700;
    text-align: left;
  }
  .dm-items-table td {
    padding: 6px 4px;
    border-bottom: 1px solid #000;
    vertical-align: top;
    font-size: 11px;
    font-weight: 700;
  }
  .dm-items-table tr {
    page-break-inside: avoid;
  }
  .dm-text-center { text-align: center !important; }
  .dm-text-right { text-align: right !important; }
  .dm-text-left { text-align: left !important; }

  .dm-summary-wrap {
    width: 100%;
    display: table;
    margin-bottom: 10px;
  }
  .dm-summary-row {
    display: table-row;
  }
  .dm-summary-left-cell {
    display: table-cell;
    vertical-align: bottom;
  }
  .dm-summary-right-cell {
    display: table-cell;
    text-align: right;
    vertical-align: top;
  }
  .dm-summary-table {
    display: inline-table;
    border-collapse: collapse;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
  }
  .dm-summary-table td {
    padding: 3px 6px;
    white-space: nowrap;
  }

  .dm-highlight-wrap {
    width: 100%;
    display: table;
    margin-bottom: 14px;
    border-top: 1px solid #000;
  }
  .dm-highlight-row {
    display: table-row;
  }
  .dm-highlight-left-spacer {
    display: table-cell;
    width: 45%;
  }
  .dm-highlight-box-cell {
    display: table-cell;
    width: 55%;
    border: 1.5px solid #000;
    padding: 8px 16px;
    vertical-align: middle;
  }
  .dm-highlight-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 18px;
    font-weight: 700;
  }
  .dm-highlight-table td {
    padding: 2px 0;
  }

  .dm-footer-section {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    page-break-inside: avoid;
  }
  .dm-signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    page-break-inside: avoid;
  }
  .dm-signatures-table td {
    vertical-align: top;
    padding: 0 8px;
  }
  .dm-sig-date-header {
    min-height: 15px;
    margin-bottom: 5px;
    font-weight: 700;
  }
  .dm-sig-space {
    height: 55px;
  }
  .dm-sig-underline {
    border-top: 1px solid #000;
    padding-top: 4px;
    margin: 0 15px;
  }
  .dm-doc-copy-note {
    margin-top: 16px;
    font-size: 10px;
    text-align: center;
    border-top: 1px dashed #000;
    padding-top: 6px;
  }
`

export function generateInvoiceDotMatrixHtml(inv: Invoice): string {
  const items = inv.items || []
  const formattedDate = formatDotMatrixDate(inv.issueDate || inv.created_at)
  const formattedDueDate = formatDotMatrixDate(inv.dueDate || inv.issueDate)
  const totalAmountStr = formatDotMatrixAmount(inv.totalAmount)
  const grandTotalCurr = formatDotMatrixCurrency(inv.totalAmount)
  const remainingCurr = formatDotMatrixCurrency(inv.remainingAmount)
  const subtotalCurr = formatDotMatrixCurrency(inv.subtotal)
  const paidCurr = formatDotMatrixCurrency(inv.paidAmount)
  const discountCurr = formatDotMatrixCurrency(inv.discount_amount)

  const itemsRows = items
    .map((it, idx) => {
      const code = it.productCode || it.product?.code || "-"
      const name = it.productName || it.product?.name || `Produk #${it.product_id}`
      const qty = it.quantity || 0
      const unit = (it.product as { unit?: { name?: string } })?.unit?.name || "pcs"
      const price = formatDotMatrixCurrency(it.unit_price)
      const discPct = it.discount_amount && it.subtotal ? `${Math.round((it.discount_amount / it.subtotal) * 100)}%` : "0%"
      const discRp = formatDotMatrixCurrency(it.discount_amount || 0)
      const tax = it.tax_amount && it.tax_amount > 0 ? formatDotMatrixCurrency(it.tax_amount) : "-"
      const rowSubtotal = formatDotMatrixCurrency(it.total || (it.subtotal || qty * it.unit_price))

      return `
        <tr>
          <td class="dm-text-center">${idx + 1}</td>
          <td>${code}</td>
          <td>${name}</td>
          <td class="dm-text-right">${qty}</td>
          <td class="dm-text-center">${unit}</td>
          <td class="dm-text-right">${price}</td>
          <td class="dm-text-center">${discPct}</td>
          <td class="dm-text-right">${discRp}</td>
          <td class="dm-text-center">${tax}</td>
          <td class="dm-text-right">${rowSubtotal}</td>
        </tr>
      `
    })
    .join("")

  const customerAddress =
    inv.customerAddress || inv.customer?.address || "Alamat penagihan sesuai kontrak"
  const customerPhone = inv.customerPhone || inv.customer?.phone || "-"

  return `
    <div class="dm-container">
      <!-- Top Header -->
      <table class="dm-header-table">
        <tr>
          <td class="dm-header-meta-col" style="width: 22%;">
            <div class="dm-meta-label">NO INVOICE</div>
            <div class="dm-meta-value">${inv.invoiceNo}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 28%;">
            <div class="dm-meta-label">TANGGAL</div>
            <div class="dm-meta-value">${formattedDate}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 28%;">
            <div class="dm-meta-label">JATUH TEMPO</div>
            <div class="dm-meta-value">${formattedDueDate}</div>
          </td>
          <td class="dm-header-title-col" style="width: 22%;">
            Invoice Penjualan
          </td>
        </tr>
      </table>

      <!-- Middle 3 Columns: Outlet | Pelanggan | Total Box -->
      <div class="dm-info-grid">
        <div class="dm-info-row">
          <div class="dm-outlet-col">
            <div class="dm-col-heading">Outlet</div>
            <div>${DOT_MATRIX_OUTLET.name}</div>
            ${DOT_MATRIX_OUTLET.addressLines.map((line) => `<div>${line}</div>`).join("")}
            <div>${DOT_MATRIX_OUTLET.email}</div>
            <div>${DOT_MATRIX_OUTLET.phone}</div>
          </div>

          <div class="dm-customer-col">
            <div class="dm-col-heading">Pelanggan</div>
            <div>${inv.customerName}</div>
            <div>${customerAddress}</div>
            <div>-</div>
            <div>${customerPhone}</div>
          </div>

          <div class="dm-total-box-col">
            <div class="dm-box-total-label">Total&nbsp;&nbsp;&nbsp;&nbsp;Rp</div>
            <div class="dm-box-total-amount">${totalAmountStr}</div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="dm-items-table">
        <thead>
          <tr>
            <th class="dm-text-center" style="width: 4%;">No.</th>
            <th style="width: 10%;">SKU</th>
            <th style="width: 26%;">Deskripsi</th>
            <th class="dm-text-right" style="width: 6%;">QTY</th>
            <th class="dm-text-center" style="width: 6%;">Unit</th>
            <th class="dm-text-right" style="width: 13%;">Harga</th>
            <th class="dm-text-center" style="width: 8%;">Diskon<br/>%</th>
            <th class="dm-text-right" style="width: 9%;">Diskon<br/>Rp</th>
            <th class="dm-text-center" style="width: 6%;">Pajak</th>
            <th class="dm-text-right" style="width: 12%;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows.length > 0 ? itemsRows : `<tr><td colspan="10" class="dm-text-center">(Tidak ada item rincian faktur)</td></tr>`}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="dm-summary-wrap">
        <div class="dm-summary-row">
          <div class="dm-summary-left-cell"></div>
          <div class="dm-summary-right-cell">
            <table class="dm-summary-table">
              <tr>
                <td>Subtotal ${items.length} Barang</td>
                <td style="width: 20px;"></td>
                <td>${subtotalCurr}</td>
              </tr>
              ${
                inv.discount_amount > 0
                  ? `
                <tr>
                  <td>Diskon</td>
                  <td></td>
                  <td>- ${discountCurr}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td>Grand Total</td>
                <td></td>
                <td>${grandTotalCurr}</td>
              </tr>
              <tr>
                <td>Uang Muka</td>
                <td></td>
                <td>Rp 0</td>
              </tr>
              <tr>
                <td>Total Terbayar</td>
                <td></td>
                <td>${paidCurr}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- SISA TAGIHAN Highlight Box -->
      <div class="dm-highlight-wrap">
        <div class="dm-highlight-row">
          <div class="dm-highlight-left-spacer"></div>
          <div class="dm-highlight-box-cell">
            <table class="dm-highlight-table">
              <tr>
                <td class="dm-text-left" style="vertical-align: middle;">SISA TAGIHAN</td>
                <td class="dm-text-right" style="vertical-align: middle; font-size: 19px;">${remainingCurr}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer / Keterangan -->
      <div class="dm-footer-section">
        <div>Keterangan:</div>
        <div>${inv.notes || "-"}</div>
        ${DOT_MATRIX_OUTLET.banks
          .map(
            (b) => `
          <div style="margin-top: 3px;">
            ${b.bank} Nomor Rekening : ${b.accountNo} ${b.accountName}
          </div>
        `
          )
          .join("")}
        <div style="margin-top: 3px;">NPWP : ${DOT_MATRIX_OUTLET.npwp}</div>
      </div>
    </div>
  `
}

export function getDeliverySigners(delivery: Delivery): Array<{ title: string; name?: string }> {
  let signers = delivery.signatures
  if (!signers || !Array.isArray(signers) || signers.length === 0) {
    if (delivery.signatures_data) {
      try {
        const parsed = JSON.parse(delivery.signatures_data)
        if (Array.isArray(parsed) && parsed.length > 0) {
          signers = parsed
        }
      } catch {
        // fallback
      }
    }
  }

  if (!signers || signers.length === 0) {
    signers = [
      { title: "Tanda Terima (Pelanggan)", name: "" },
      { title: "Pengemudi / Kurir", name: "" },
      { title: "Petugas Gudang", name: "" },
    ]
  }

  return signers
}

export function renderDeliverySignaturesHtml(delivery: Delivery): string {
  const signers = getDeliverySigners(delivery)
  const city = delivery.signature_city || "Jakarta"
  const dateFormatted = formatDotMatrixDateOnly(delivery.signature_date || delivery.date || new Date())
  const rightDateText = `${city}, ${dateFormatted}`

  // Layout logic based on signer count:
  // 1 signer: single column
  // 2 signers: 1st far left, 2nd far right (middle space)
  // 3 signers: left, center, right
  // 4+ signers: evenly distributed across full width
  if (signers.length === 1) {
    const s = signers[0]
    return `
      <table class="dm-signatures-table">
        <tr>
          <td style="width: 50%; text-align: center; margin: 0 auto;">
            <div class="dm-sig-date-header">${rightDateText}</div>
            <div>${s.title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${s.name ? s.name : ".........................."} )</div>
          </td>
        </tr>
      </table>
    `
  }

  if (signers.length === 2) {
    const s1 = signers[0]
    const s2 = signers[1]
    return `
      <table class="dm-signatures-table">
        <tr>
          <td style="width: 38%; text-align: center;">
            <div class="dm-sig-date-header">&nbsp;</div>
            <div>${s1.title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${s1.name ? s1.name : ".........................."} )</div>
          </td>
          <td style="width: 24%;">&nbsp;</td>
          <td style="width: 38%; text-align: center;">
            <div class="dm-sig-date-header">${rightDateText}</div>
            <div>${s2.title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${s2.name ? s2.name : ".........................."} )</div>
          </td>
        </tr>
      </table>
    `
  }

  if (signers.length === 3) {
    return `
      <table class="dm-signatures-table">
        <tr>
          <td style="width: 33.33%; text-align: center;">
            <div class="dm-sig-date-header">&nbsp;</div>
            <div>${signers[0].title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${signers[0].name ? signers[0].name : ".........................."} )</div>
          </td>
          <td style="width: 33.33%; text-align: center;">
            <div class="dm-sig-date-header">&nbsp;</div>
            <div>${signers[1].title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${signers[1].name ? signers[1].name : ".........................."} )</div>
          </td>
          <td style="width: 33.33%; text-align: center;">
            <div class="dm-sig-date-header">${rightDateText}</div>
            <div>${signers[2].title}</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${signers[2].name ? signers[2].name : ".........................."} )</div>
          </td>
        </tr>
      </table>
    `
  }

  // 4 or more signers
  const colWidth = (100 / signers.length).toFixed(2)
  const cells = signers
    .map((s, idx) => {
      const isRightmost = idx === signers.length - 1
      return `
        <td style="width: ${colWidth}%; text-align: center;">
          <div class="dm-sig-date-header">${isRightmost ? rightDateText : "&nbsp;"}</div>
          <div>${s.title}</div>
          <div class="dm-sig-space"></div>
          <div class="dm-sig-underline">( ${s.name ? s.name : ".........................."} )</div>
        </td>
      `
    })
    .join("")

  return `
    <table class="dm-signatures-table">
      <tr>
        ${cells}
      </tr>
    </table>
  `
}

export function generateDeliveryDotMatrixHtml(delivery: Delivery): string {
  const items = delivery.items || []
  const formattedDate = formatDotMatrixDate(delivery.date || delivery.created_at)
  const warehouseName =
    typeof delivery.warehouse === "object"
      ? (delivery.warehouse as { name?: string })?.name || "Gudang Utama"
      : delivery.warehouse || "Gudang Utama"

  const itemsRows = items
    .map((it, idx) => {
      const code = it.productCode || it.product?.code || "-"
      const name = it.productName || it.product?.name || `Produk #${it.product_id}`
      const qty = it.quantity || 0
      const unit = (it.product as { unit?: { name?: string } })?.unit?.name || "pcs"

      return `
        <tr>
          <td class="dm-text-center">${idx + 1}</td>
          <td>${code}</td>
          <td>${name}</td>
          <td class="dm-text-right">${qty}</td>
          <td class="dm-text-center">${unit}</td>
          <td>Kondisi Baik / Segel Utuh</td>
        </tr>
      `
    })
    .join("")

  const customerName = delivery.customerName || delivery.customer?.name || "Pelanggan"
  const customerAddress =
    (delivery.customer as { address?: string })?.address || "Alamat pengiriman sesuai pesanan pelanggan"
  const customerPhone = (delivery.customer as { phone?: string })?.phone || "-"

  return `
    <div class="dm-container">
      <!-- Top Header -->
      <table class="dm-header-table">
        <tr>
          <td class="dm-header-meta-col" style="width: 25%;">
            <div class="dm-meta-label">NO SURAT JALAN</div>
            <div class="dm-meta-value">${delivery.deliveryNo}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 25%;">
            <div class="dm-meta-label">TANGGAL</div>
            <div class="dm-meta-value">${formattedDate}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 28%;">
            <div class="dm-meta-label">REF. ORDER</div>
            <div class="dm-meta-value">${delivery.refOrder || "-"}</div>
          </td>
          <td class="dm-header-title-col" style="width: 22%;">
            Surat Jalan
          </td>
        </tr>
      </table>

      <!-- Middle 3 Columns: Outlet | Pelanggan | Total Muatan Box -->
      <div class="dm-info-grid">
        <div class="dm-info-row">
          <div class="dm-outlet-col">
            <div class="dm-col-heading">Outlet / Pengirim</div>
            <div>${DOT_MATRIX_OUTLET.name}</div>
            ${DOT_MATRIX_OUTLET.addressLines.map((line) => `<div>${line}</div>`).join("")}
            <div>Gudang Asal: ${warehouseName}</div>
            <div>${DOT_MATRIX_OUTLET.phone}</div>
          </div>

          <div class="dm-customer-col">
            <div class="dm-col-heading">Pelanggan / Penerima</div>
            <div>${customerName}</div>
            <div>${customerAddress}</div>
            <div>-</div>
            <div>${customerPhone}</div>
          </div>

          <div class="dm-total-box-col">
            <div class="dm-box-total-label">Total Muatan</div>
            <div class="dm-box-total-amount">${delivery.totalItems} Unit</div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="dm-items-table">
        <thead>
          <tr>
            <th class="dm-text-center" style="width: 5%;">No.</th>
            <th style="width: 15%;">SKU</th>
            <th style="width: 45%;">Deskripsi Barang</th>
            <th class="dm-text-right" style="width: 10%;">QTY</th>
            <th class="dm-text-center" style="width: 10%;">Unit</th>
            <th style="width: 15%;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows.length > 0 ? itemsRows : `<tr><td colspan="6" class="dm-text-center">(Tidak ada rincian muatan barang)</td></tr>`}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="dm-summary-wrap">
        <div class="dm-summary-row">
          <div class="dm-summary-left-cell">
            <div><strong>Ekspedisi / Armada:</strong> ${delivery.courierFleet || "-"}</div>
            <div><strong>No. Resi Pengiriman:</strong> ${delivery.trackingNumber || "-"}</div>
            ${delivery.notes ? `<div><strong>Catatan:</strong> ${delivery.notes}</div>` : ""}
          </div>
          <div class="dm-summary-right-cell">
            <table class="dm-summary-table">
              <tr>
                <td>Total Muatan Pengiriman</td>
                <td style="width: 10px;">:</td>
                <td><strong>${delivery.totalItems} Unit</strong></td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Highlight Box -->
      <div class="dm-highlight-wrap">
        <div class="dm-highlight-row">
          <div class="dm-highlight-left-spacer"></div>
          <div class="dm-highlight-box-cell">
            <table class="dm-highlight-table">
              <tr>
                <td class="dm-text-left" style="vertical-align: middle;">TOTAL MUATAN</td>
                <td class="dm-text-right" style="vertical-align: middle; font-size: 19px;">${delivery.totalItems} UNIT</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      ${renderDeliverySignaturesHtml(delivery)}

      <div class="dm-doc-copy-note">
        * Lembar 1: Putih (Pelanggan) &nbsp;|&nbsp; Lembar 2: Merah (Gudang) &nbsp;|&nbsp; Lembar 3: Kuning (Finance) *
      </div>
    </div>
  `
}

export function generateSalesOrderDotMatrixHtml(order: SalesOrder): string {
  const items = order.items || []
  const formattedDate = formatDotMatrixDate(order.date || order.created_at)
  const totalAmountStr = formatDotMatrixAmount(order.totalAmount)
  const grandTotalCurr = formatDotMatrixCurrency(order.totalAmount)
  const subtotalCurr = formatDotMatrixCurrency(order.subtotal)
  const discountCurr = formatDotMatrixCurrency(order.discount_amount)

  const itemsRows = items
    .map((it, idx) => {
      const code = it.productCode || it.product?.code || "-"
      const name = it.productName || it.product?.name || `Produk #${it.product_id}`
      const qty = it.quantity || 0
      const unit = (it.product as { unit?: { name?: string } })?.unit?.name || "pcs"
      const price = formatDotMatrixCurrency(it.unit_price)
      const discPct = it.discount_amount && it.subtotal ? `${Math.round((it.discount_amount / it.subtotal) * 100)}%` : "0%"
      const discRp = formatDotMatrixCurrency(it.discount_amount || 0)
      const tax = it.tax_amount && it.tax_amount > 0 ? formatDotMatrixCurrency(it.tax_amount) : "-"
      const rowSubtotal = formatDotMatrixCurrency(it.total || (it.subtotal || qty * it.unit_price))

      return `
        <tr>
          <td class="dm-text-center">${idx + 1}</td>
          <td>${code}</td>
          <td>${name}</td>
          <td class="dm-text-right">${qty}</td>
          <td class="dm-text-center">${unit}</td>
          <td class="dm-text-right">${price}</td>
          <td class="dm-text-center">${discPct}</td>
          <td class="dm-text-right">${discRp}</td>
          <td class="dm-text-center">${tax}</td>
          <td class="dm-text-right">${rowSubtotal}</td>
        </tr>
      `
    })
    .join("")

  const customerName = order.customerName || order.customer?.name || "Pelanggan"
  const customerAddress =
    order.shipping_address || order.customer?.address || "Alamat pengiriman sesuai kontrak"
  const customerPhone = order.recipient_phone || order.customer?.phone || "-"

  return `
    <div class="dm-container">
      <!-- Top Header -->
      <table class="dm-header-table">
        <tr>
          <td class="dm-header-meta-col" style="width: 25%;">
            <div class="dm-meta-label">NO SALES ORDER</div>
            <div class="dm-meta-value">${order.orderNo}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 25%;">
            <div class="dm-meta-label">TANGGAL</div>
            <div class="dm-meta-value">${formattedDate}</div>
          </td>
          <td class="dm-header-meta-col" style="width: 28%;">
            <div class="dm-meta-label">REF. PENAWARAN</div>
            <div class="dm-meta-value">${order.refQuotation || "-"}</div>
          </td>
          <td class="dm-header-title-col" style="width: 22%;">
            Pesanan Penjualan
          </td>
        </tr>
      </table>

      <!-- Middle 3 Columns: Outlet | Pelanggan | Total Box -->
      <div class="dm-info-grid">
        <div class="dm-info-row">
          <div class="dm-outlet-col">
            <div class="dm-col-heading">Outlet / Penjual</div>
            <div>${DOT_MATRIX_OUTLET.name}</div>
            ${DOT_MATRIX_OUTLET.addressLines.map((line) => `<div>${line}</div>`).join("")}
            <div>${DOT_MATRIX_OUTLET.email}</div>
            <div>${DOT_MATRIX_OUTLET.phone}</div>
          </div>

          <div class="dm-customer-col">
            <div class="dm-col-heading">Pelanggan / Pemesan</div>
            <div>${customerName}</div>
            <div>${customerAddress}</div>
            <div>-</div>
            <div>${customerPhone}</div>
          </div>

          <div class="dm-total-box-col">
            <div class="dm-box-total-label">Total&nbsp;&nbsp;&nbsp;&nbsp;Rp</div>
            <div class="dm-box-total-amount">${totalAmountStr}</div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="dm-items-table">
        <thead>
          <tr>
            <th class="dm-text-center" style="width: 4%;">No.</th>
            <th style="width: 10%;">SKU</th>
            <th style="width: 26%;">Deskripsi</th>
            <th class="dm-text-right" style="width: 6%;">QTY</th>
            <th class="dm-text-center" style="width: 6%;">Unit</th>
            <th class="dm-text-right" style="width: 13%;">Harga</th>
            <th class="dm-text-center" style="width: 8%;">Diskon<br/>%</th>
            <th class="dm-text-right" style="width: 9%;">Diskon<br/>Rp</th>
            <th class="dm-text-center" style="width: 6%;">Pajak</th>
            <th class="dm-text-right" style="width: 12%;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows.length > 0 ? itemsRows : `<tr><td colspan="10" class="dm-text-center">(Tidak ada rincian item pesanan)</td></tr>`}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="dm-summary-wrap">
        <div class="dm-summary-row">
          <div class="dm-summary-left-cell">
            ${order.notes ? `<div><strong>Catatan:</strong> ${order.notes}</div>` : ""}
          </div>
          <div class="dm-summary-right-cell">
            <table class="dm-summary-table">
              <tr>
                <td>Subtotal ${items.length} Barang</td>
                <td style="width: 20px;"></td>
                <td>${subtotalCurr}</td>
              </tr>
              ${
                order.discount_amount > 0
                  ? `
                <tr>
                  <td>Diskon</td>
                  <td></td>
                  <td>- ${discountCurr}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td>Grand Total</td>
                <td></td>
                <td>${grandTotalCurr}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- TOTAL PESANAN Highlight Box -->
      <div class="dm-highlight-wrap">
        <div class="dm-highlight-row">
          <div class="dm-highlight-left-spacer"></div>
          <div class="dm-highlight-box-cell">
            <table class="dm-highlight-table">
              <tr>
                <td class="dm-text-left" style="vertical-align: middle;">TOTAL PESANAN</td>
                <td class="dm-text-right" style="vertical-align: middle; font-size: 19px;">${grandTotalCurr}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer / Keterangan & Bank Info -->
      <div class="dm-footer-section">
        <div>Keterangan Pembayaran:</div>
        ${DOT_MATRIX_OUTLET.banks
          .map(
            (b) => `
          <div style="margin-top: 3px;">
            ${b.bank} Nomor Rekening : ${b.accountNo} ${b.accountName}
          </div>
        `
          )
          .join("")}
        <div style="margin-top: 3px;">NPWP : ${DOT_MATRIX_OUTLET.npwp}</div>
      </div>

      <!-- Signatures -->
      <table class="dm-signatures-table">
        <tr>
          <td>
            <div>Pelanggan / Pemesan,</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( ${customerName} )</div>
          </td>
          <td>
            <div>Admin Penjualan,</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( .......................... )</div>
          </td>
          <td>
            <div>Menyetujui (Manager),</div>
            <div class="dm-sig-space"></div>
            <div class="dm-sig-underline">( .......................... )</div>
          </td>
        </tr>
      </table>
    </div>
  `
}

export const DOT_MATRIX_PRINT_PAGE_CSS = `
  @page {
    size: landscape;
    margin: 8mm 12mm;
  }
  @media print {
    @page {
      size: landscape;
      margin: 8mm 12mm;
    }
    html, body {
      width: 100%;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
    }
    .dm-container {
      max-width: 100% !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Courier New', Courier, monospace !important;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.25;
  }
`

export const DOT_MATRIX_BASE_CSS = DOT_MATRIX_PRINT_PAGE_CSS + DOT_MATRIX_STYLES_CSS

export function DotMatrixPreview({ html }: { html: string }) {
  return (
    <div className="relative rounded-lg border-2 border-slate-300 bg-white p-3 font-mono text-xs overflow-x-auto shadow-inner text-black">
      <style>{DOT_MATRIX_STYLES_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

export function printDotMatrixHtml(bodyHtml: string, title = "Cetak Dot Matrix"): void {
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${DOT_MATRIX_BASE_CSS}
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `)
  doc.close()

  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1500)
  }, 300)
}

