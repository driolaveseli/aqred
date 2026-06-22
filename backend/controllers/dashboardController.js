const db = require("../config/db");

exports.getStats = async (req, res) => {
  const companyId = req.user.company_id;
  try {
    const [employeeCount, customerCount, productCount, orderCount, totalRevenue] = await Promise.all([
      db.query("SELECT COUNT(*) FROM employees WHERE company_id = $1", [companyId]),
      db.query("SELECT COUNT(*) FROM customers WHERE company_id = $1", [companyId]),
      db.query("SELECT COUNT(*) FROM products WHERE company_id = $1", [companyId]),
      db.query("SELECT COUNT(*) FROM orders WHERE company_id = $1", [companyId]),
      db.query("SELECT SUM(total) FROM orders WHERE company_id = $1", [companyId]),
    ]);

    res.json({
      employees: employeeCount.rows[0].count,
      customers: customerCount.rows[0].count,
      products: productCount.rows[0].count,
      orders: orderCount.rows[0].count,
      revenue: totalRevenue.rows[0].sum || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOverview = async (req, res) => {
  const companyId = req.user.company_id;
  try {
    const [
      kpiRes,
      monthlyRes,
      statusRes,
      recentOrdersRes,
      lowStockRes,
      categoryRes,
    ] = await Promise.all([

      // KPI: totals + current-month vs previous-month
      db.query(`
        SELECT
          COUNT(*)::INT                                                        AS total_orders,
          COUNT(*) FILTER (WHERE LOWER(status) = 'pending')::INT              AS pending_orders,
          COUNT(*) FILTER (WHERE LOWER(status) = 'completed')::INT            AS completed_orders,
          COALESCE(SUM(total), 0)::FLOAT                                       AS total_revenue,
          COUNT(DISTINCT customer_id)::INT                                    AS total_customers,

          -- current month
          COUNT(*) FILTER (
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', NOW())
          )::INT AS orders_this_month,
          COALESCE(SUM(total) FILTER (
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', NOW())
              AND LOWER(status) != 'cancelled'
          ), 0)::FLOAT AS revenue_this_month,

          -- previous month
          COUNT(*) FILTER (
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          )::INT AS orders_last_month,
          COALESCE(SUM(total) FILTER (
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
              AND LOWER(status) != 'cancelled'
          ), 0)::FLOAT AS revenue_last_month

        FROM orders
        WHERE company_id = $1
      `, [companyId]),

      // Monthly revenue trend — last 12 months
      db.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', order_date), 'Mon')          AS name,
          EXTRACT(YEAR  FROM DATE_TRUNC('month', order_date))::INT  AS year,
          EXTRACT(MONTH FROM DATE_TRUNC('month', order_date))::INT  AS month_num,
          COALESCE(SUM(total), 0)::FLOAT                            AS revenue,
          COUNT(*)::INT                                              AS orders
        FROM orders
        WHERE company_id = $1
          AND LOWER(status) != 'cancelled'
          AND order_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', order_date)
        ORDER BY DATE_TRUNC('month', order_date)
      `, [companyId]),

      // Order status breakdown
      db.query(`
        SELECT
          INITCAP(status) AS status,
          COUNT(*)::INT   AS count
        FROM orders
        WHERE company_id = $1
        GROUP BY LOWER(status), INITCAP(status)
        ORDER BY count DESC
      `, [companyId]),

      // Recent 5 orders
      db.query(`
        SELECT o.id, o.status, o.total::FLOAT, o.order_date, o.created_at,
               c.name AS customer_name,
               COUNT(oi.id)::INT AS item_count
        FROM orders o
        LEFT JOIN customers c  ON c.id  = o.customer_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.company_id = $1
        GROUP BY o.id, o.status, o.total, o.order_date, o.created_at, c.name
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [companyId]),

      // Low-stock products
      db.query(`
        SELECT id, name, stock, reorder_point, category
        FROM products
        WHERE company_id = $1
          AND stock <= reorder_point
        ORDER BY stock ASC
        LIMIT 6
      `, [companyId]),

      // Product category distribution
      db.query(`
        SELECT COALESCE(category, 'Uncategorised') AS name,
               COUNT(*)::INT AS value
        FROM products
        WHERE company_id = $1
        GROUP BY category
        ORDER BY value DESC
        LIMIT 6
      `, [companyId]),
    ]);

    const kpi = kpiRes.rows[0] || {};

    // separate counts
    const [empRes, custRes, prodRes] = await Promise.all([
      db.query("SELECT COUNT(*)::INT AS n FROM employees WHERE company_id=$1", [companyId]),
      db.query("SELECT COUNT(*)::INT AS n FROM customers  WHERE company_id=$1", [companyId]),
      db.query("SELECT COUNT(*)::INT AS n FROM products   WHERE company_id=$1", [companyId]),
    ]);

    res.json({
      kpi: {
        ...kpi,
        employees: empRes.rows[0].n,
        customers:  custRes.rows[0].n,
        products:   prodRes.rows[0].n,
      },
      monthly:      monthlyRes.rows,
      statusBreakdown: statusRes.rows,
      recentOrders: recentOrdersRes.rows,
      lowStock:     lowStockRes.rows,
      categories:   categoryRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
