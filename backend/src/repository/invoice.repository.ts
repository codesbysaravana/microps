import { pool } from '../config/db';
import { Invoice } from '../types/billing.types';

export class InvoiceRepository {
  async findByOrganizationId(organizationId: number): Promise<Invoice[]> {
    const res = await pool.query(
      'SELECT * FROM invoices WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId]
    );
    return res.rows;
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    const res = await pool.query(`
      INSERT INTO invoices (organization_id, subscription_id, invoice_number, amount_due_cents, amount_paid_cents, status, billing_period)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      invoice.organization_id,
      invoice.subscription_id,
      invoice.invoice_number,
      invoice.amount_due_cents,
      invoice.amount_paid_cents,
      invoice.status,
      invoice.billing_period,
    ]);
    return res.rows[0];
  }
}

export const invoiceRepository = new InvoiceRepository();
