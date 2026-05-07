import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import './styles.css';

const seedCustomers = [
  { name: 'Ama Boateng', phone: '024 118 4200', type: 'Regular', address: 'East Legon', balance: 85 },
  { name: 'Kojo Mensah', phone: '020 771 9032', type: 'Corporate', address: 'Airport City', balance: 0 },
  { name: 'Nadia Owusu', phone: '055 331 0021', type: 'VIP', address: 'Cantonments', balance: 120 },
  { name: 'Bright Hotel', phone: '030 245 9911', type: 'Hotel', address: 'Osu', balance: 430 }
];

const seedOrders = [
  { id: 'FL-1048', customer: 'Ama Boateng', service: 'Wash & Fold', items: 14, status: 'Received', amount: 185, paid: 100, due: 'Today 4:30 PM', owner: 'Mina' },
  { id: 'FL-1047', customer: 'Kojo Mensah', service: 'Dry Cleaning', items: 3, status: 'Washing', amount: 240, paid: 240, due: 'Today 6:00 PM', owner: 'Kelvin' },
  { id: 'FL-1046', customer: 'Nadia Owusu', service: 'Ironing Only', items: 18, status: 'Ironing', amount: 180, paid: 60, due: 'Tomorrow 10:00 AM', owner: 'Akos' },
  { id: 'FL-1045', customer: 'Bright Hotel', service: 'Bedsheets', items: 42, status: 'Ready', amount: 720, paid: 290, due: 'Ready now', owner: 'Mina' },
  { id: 'FL-1044', customer: 'Kwame Addo', service: 'Express Service', items: 7, status: 'Washing', amount: 210, paid: 210, due: 'Today 2:15 PM', owner: 'Kelvin' },
  { id: 'FL-1043', customer: 'Esi Agyeman', service: 'Curtains', items: 5, status: 'Ready', amount: 300, paid: 300, due: 'Ready now', owner: 'Akos' }
];

const seedPayments = [
  { id: 'PAY-781', order: 'FL-1047', customer: 'Kojo Mensah', method: 'Mobile Money', amount: 240, time: '09:42' },
  { id: 'PAY-780', order: 'FL-1048', customer: 'Ama Boateng', method: 'Cash', amount: 100, time: '09:18' },
  { id: 'PAY-779', order: 'FL-1045', customer: 'Bright Hotel', method: 'Bank Transfer', amount: 290, time: '08:55' },
  { id: 'PAY-778', order: 'FL-1043', customer: 'Esi Agyeman', method: 'Card', amount: 300, time: '08:12' }
];

const seedInventory = [
  { name: 'Detergent', stock: 12, level: 20, unit: 'kg' },
  { name: 'Garment tags', stock: 86, level: 150, unit: 'pcs' },
  { name: 'Hangers', stock: 260, level: 120, unit: 'pcs' },
  { name: 'Packaging bags', stock: 42, level: 80, unit: 'pcs' }
];

const seedExpenses = [
  { category: 'Electricity', amount: 380, date: '2026-05-07', owner: 'Admin' },
  { category: 'Detergent', amount: 260, date: '2026-05-06', owner: 'Mina' },
  { category: 'Delivery Fuel', amount: 145, date: '2026-05-06', owner: 'Kelvin' },
  { category: 'Repairs', amount: 210, date: '2026-05-05', owner: 'Admin' }
];

const seedServices = [
  { name: 'Wash & Fold', default_price: 12 },
  { name: 'Dry Cleaning', default_price: 80 },
  { name: 'Ironing Only', default_price: 10 },
  { name: 'Bedsheets', default_price: 18 },
  { name: 'Express Service', default_price: 30 },
  { name: 'Curtains', default_price: 60 }
];

const navItems = ['Dashboard', 'Orders', 'Customers', 'Payments', 'Inventory', 'Expenses', 'Reports', 'Settings'];
const pipelineStatuses = ['Received', 'Washing', 'Ironing', 'Ready'];
const fullStatuses = ['Received', 'Sorting', 'Washing', 'Drying', 'Ironing', 'Packaging', 'Ready', 'Delivered', 'Collected', 'Cancelled'];

function currency(value) {
  return `GHS ${Number(value || 0).toLocaleString()}`;
}

function formatAuthError(message) {
  if (!message) return 'Authentication failed. Please try again.';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email rate limit') || lowerMessage.includes('rate limit')) {
    return 'Supabase has temporarily hit its authentication email sending limit. Try again later, or configure custom SMTP in Supabase Auth before onboarding more users.';
  }

  return message;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function orderBalance(order) {
  return Math.max(Number(order.amount || 0) - Number(order.paid || 0), 0);
}

function mapDbOrder(order) {
  const quantity = order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;
  return {
    dbId: order.id,
    id: order.order_number,
    customerId: order.customer_id,
    customer: order.customer_name,
    service: order.service_name,
    items: quantity,
    status: order.status,
    amount: Number(order.total_amount),
    paid: Number(order.amount_paid),
    due: order.due_label || 'No due date',
    delivery: order.pickup_delivery || 'pickup',
    owner: order.staff_owner || 'Staff',
    createdAt: order.created_at
  };
}

function mapDbPayment(payment) {
  return {
    dbId: payment.id,
    id: payment.receipt_number,
    orderDbId: payment.order_id,
    order: payment.orders?.order_number || 'Order',
    customer: payment.orders?.customer_name || 'Customer',
    method: payment.method,
    amount: Number(payment.amount),
    time: new Date(payment.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: payment.paid_at
  };
}

function Icon({ name }) {
  const paths = {
    Dashboard: 'M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Zm10-9h6V4h-6v7Z',
    Orders: 'M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4',
    Customers: 'M16 11a4 4 0 1 0-8 0M4 20c1.4-4 14.6-4 16 0M18 8a3 3 0 0 1 2 5',
    Payments: 'M3 6h18v12H3V6Zm0 4h18M7 15h4',
    Inventory: 'M4 7l8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10',
    Expenses: 'M12 3v18M17 7.5c-.7-1-2-1.5-3.7-1.5-2 0-3.3.9-3.3 2.4 0 3.7 7 1.4 7 5.2 0 1.6-1.5 2.9-4 2.9-1.9 0-3.4-.6-4.4-1.8',
    Reports: 'M5 19V5M5 19h15M9 16v-5M13 16V8M17 16v-8',
    Settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z',
    Search: 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21',
    Plus: 'M12 5v14M5 12h14'
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={paths[name] || paths.Dashboard} />
    </svg>
  );
}

function App() {
  const [active, setActive] = useState('Dashboard');
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState(seedCustomers.map((customer, index) => ({ id: index + 1, ...customer })));
  const [services, setServices] = useState(seedServices.map((service, index) => ({ id: index + 1, active: true, pricing_type: 'item', ...service })));
  const [orders, setOrders] = useState(seedOrders);
  const [payments, setPayments] = useState(seedPayments);
  const [inventoryItems, setInventoryItems] = useState(seedInventory);
  const [expenseItems, setExpenseItems] = useState(seedExpenses);
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setLoading] = useState(Boolean(hasSupabaseConfig));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setMessage('Supabase is not configured. Using sample data only.');
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    bootstrapWorkspace(session.user);
  }, [session?.user?.id]);

  const metrics = useMemo(() => {
    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstanding = orders.reduce((sum, order) => sum + orderBalance(order), 0);
    return [
      { label: 'Today Sales', value: currency(paid), trend: `${payments.length} payments` },
      { label: 'Active Orders', value: orders.filter((order) => !['Ready', 'Delivered', 'Collected', 'Cancelled'].includes(order.status)).length, trend: 'Open production' },
      { label: 'Ready Pickup', value: orders.filter((order) => order.status === 'Ready').length, trend: 'Ready now' },
      { label: 'Outstanding Balance', value: currency(outstanding), trend: 'Needs follow-up' }
    ];
  }, [orders, payments]);

  const filteredOrders = orders.filter((order) =>
    `${order.customer} ${order.id} ${order.service} ${order.status}`.toLowerCase().includes(query.toLowerCase())
  );

  async function bootstrapWorkspace(user) {
    setLoading(true);
    setMessage('');
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Laundry User'
      });

      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: true });
      if (businessError) throw businessError;

      let activeBusiness = businesses?.[0];
      if (!activeBusiness) {
        const { data: createdBusiness, error: createBusinessError } = await supabase
          .from('businesses')
          .insert({ name: 'FreshLedger Laundry', created_by: user.id })
          .select()
          .single();
        if (createBusinessError) throw createBusinessError;
        activeBusiness = createdBusiness;
      }

      await ensureOwnerMembership(activeBusiness.id, user.id);
      setBusiness(activeBusiness);

      const seeded = await hasSeedData(activeBusiness.id);
      if (!seeded) await seedBusiness(activeBusiness.id, user.id);
      await loadBusinessData(activeBusiness.id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function ensureOwnerMembership(businessId, userId) {
    const { data } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) {
      const { error } = await supabase.from('business_members').insert({ business_id: businessId, user_id: userId, role: 'owner' });
      if (error) throw error;
    }
  }

  async function hasSeedData(businessId) {
    const { data, error } = await supabase.from('orders').select('id').eq('business_id', businessId).limit(1);
    if (error) throw error;
    return data.length > 0;
  }

  async function seedBusiness(businessId, userId) {
    await supabase.from('customers').insert(seedCustomers.map((customer) => ({
      business_id: businessId,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      type: customer.type
    })));
    await supabase.from('services').insert(seedServices.map((service) => ({
      business_id: businessId,
      name: service.name,
      default_price: service.default_price
    })));
    await supabase.from('inventory_items').insert(seedInventory.map((item) => ({
      business_id: businessId,
      name: item.name,
      quantity_available: item.stock,
      reorder_level: item.level,
      unit: item.unit
    })));
    await supabase.from('expenses').insert(seedExpenses.map((expense) => ({
      business_id: businessId,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.date,
      recorded_by: userId,
      description: expense.owner
    })));
    for (const order of seedOrders) {
      const { data: insertedOrder } = await supabase.from('orders').insert({
        business_id: businessId,
        order_number: order.id,
        customer_name: order.customer,
        service_name: order.service,
        status: order.status,
        due_label: order.due,
        subtotal: order.amount,
        total_amount: order.amount,
        amount_paid: order.paid,
        staff_owner: order.owner,
        created_by: userId
      }).select().single();
      if (insertedOrder) {
        await supabase.from('order_items').insert({
          business_id: businessId,
          order_id: insertedOrder.id,
          description: order.service,
          quantity: order.items,
          unit_price: order.amount / order.items
        });
      }
    }
  }

  async function loadBusinessData(businessId) {
    const [customerResult, serviceResult, orderResult, paymentResult, inventoryResult, expenseResult, memberResult] = await Promise.all([
      supabase.from('customers').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('business_id', businessId).order('name'),
      supabase.from('orders').select('*, order_items(quantity)').eq('business_id', businessId).order('created_at', { ascending: false }),
      supabase.from('payments').select('*, orders(order_number, customer_name)').eq('business_id', businessId).order('paid_at', { ascending: false }),
      supabase.from('inventory_items').select('*').eq('business_id', businessId).order('name'),
      supabase.from('expenses').select('*').eq('business_id', businessId).order('expense_date', { ascending: false }),
      supabase.from('business_members').select('*').eq('business_id', businessId).order('created_at', { ascending: true })
    ]);
    const error = [customerResult, serviceResult, orderResult, paymentResult, inventoryResult, expenseResult, memberResult].find((result) => result.error)?.error;
    if (error) throw error;

    const mappedOrders = orderResult.data.map(mapDbOrder);
    setOrders(mappedOrders);
    setPayments(paymentResult.data.map(mapDbPayment));
    setCustomers(customerResult.data.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      type: customer.type,
      address: customer.address || '',
      notes: customer.notes || '',
      balance: mappedOrders.filter((order) => order.customer === customer.name).reduce((sum, order) => sum + orderBalance(order), 0)
    })));
    setServices(serviceResult.data);
    setInventoryItems(inventoryResult.data.map((item) => ({
      id: item.id,
      name: item.name,
      stock: Number(item.quantity_available),
      level: Number(item.reorder_level),
      unit: item.unit,
      supplier: item.supplier || '',
      cost: Number(item.unit_cost)
    })));
    setExpenseItems(expenseResult.data.map((expense) => ({
      id: expense.id,
      category: expense.category,
      amount: Number(expense.amount),
      date: expense.expense_date,
      owner: expense.description || 'Staff'
    })));
    setMembers(memberResult.data);
  }

  async function refresh() {
    if (business) await loadBusinessData(business.id);
  }

  async function advanceOrder(orderId, nextStatus) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    const status = nextStatus || pipelineStatuses[Math.min(pipelineStatuses.indexOf(order.status) + 1, pipelineStatuses.length - 1)];
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, status } : item));
    if (business && order.dbId) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', order.dbId);
      if (error) setMessage(error.message);
      await refresh();
    }
  }

  async function saveCustomer(event, customer) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      business_id: business?.id,
      name: form.get('name'),
      phone: form.get('phone'),
      address: form.get('address'),
      type: form.get('type'),
      notes: form.get('notes')
    };
    if (!business) return;
    const result = customer?.id
      ? await supabase.from('customers').update(payload).eq('id', customer.id)
      : await supabase.from('customers').insert(payload);
    if (result.error) setMessage(result.error.message);
    else {
      setModal(null);
      setSelectedCustomer(null);
      await refresh();
    }
  }

  async function saveOrder(event) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    const paid = Number(form.get('paid'));
    const items = Number(form.get('items'));
    const selectedCustomerId = form.get('customerId');
    const selectedCustomer = customers.find((customer) => String(customer.id) === selectedCustomerId);
    const customerName = selectedCustomer?.name || form.get('customerName');
    const serviceName = form.get('service');
    const orderNumber = `FL-${String(1050 + orders.length + 1).padStart(4, '0')}`;

    let customerId = selectedCustomer?.id;
    if (!customerId && customerName) {
      const { data, error } = await supabase.from('customers').insert({
        business_id: business.id,
        name: customerName,
        phone: form.get('customerPhone'),
        type: 'Walk-in'
      }).select().single();
      if (error) {
        setMessage(error.message);
        return;
      }
      customerId = data.id;
    }

    const { data: insertedOrder, error } = await supabase.from('orders').insert({
      business_id: business.id,
      order_number: orderNumber,
      customer_id: customerId || null,
      customer_name: customerName,
      service_name: serviceName,
      status: form.get('status'),
      pickup_delivery: form.get('delivery'),
      due_label: form.get('due'),
      subtotal: amount,
      total_amount: amount,
      amount_paid: paid,
      staff_owner: form.get('owner') || 'Reception',
      created_by: session.user.id
    }).select().single();
    if (error) {
      setMessage(error.message);
      return;
    }
    await supabase.from('order_items').insert({
      business_id: business.id,
      order_id: insertedOrder.id,
      description: serviceName,
      quantity: items,
      unit_price: amount / Math.max(items, 1)
    });
    if (paid > 0) {
      await supabase.from('payments').insert({
        business_id: business.id,
        order_id: insertedOrder.id,
        receipt_number: `PAY-${String(800 + payments.length + 1).padStart(3, '0')}`,
        amount: paid,
        method: form.get('method'),
        received_by: session.user.id
      });
    }
    setModal(null);
    await refresh();
  }

  async function recordPayment(event) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const order = orders.find((item) => item.dbId === form.get('orderDbId'));
    const amount = Number(form.get('amount'));
    if (!order) return;
    const { error } = await supabase.from('payments').insert({
      business_id: business.id,
      order_id: order.dbId,
      receipt_number: `PAY-${String(800 + payments.length + 1).padStart(3, '0')}`,
      amount,
      method: form.get('method'),
      notes: form.get('notes'),
      received_by: session.user.id
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    await supabase.from('orders').update({ amount_paid: Math.min(order.amount, order.paid + amount) }).eq('id', order.dbId);
    setModal(null);
    await refresh();
  }

  async function saveInventory(event, item) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      business_id: business.id,
      name: form.get('name'),
      quantity_available: Number(form.get('stock')),
      reorder_level: Number(form.get('level')),
      unit: form.get('unit'),
      unit_cost: Number(form.get('cost') || 0),
      supplier: form.get('supplier')
    };
    const result = item?.id
      ? await supabase.from('inventory_items').update(payload).eq('id', item.id)
      : await supabase.from('inventory_items').insert(payload);
    if (result.error) setMessage(result.error.message);
    else {
      setModal(null);
      await refresh();
    }
  }

  async function saveExpense(event) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from('expenses').insert({
      business_id: business.id,
      category: form.get('category'),
      description: form.get('description'),
      amount: Number(form.get('amount')),
      expense_date: form.get('date'),
      recorded_by: session.user.id
    });
    if (error) setMessage(error.message);
    else {
      setModal(null);
      await refresh();
    }
  }

  async function saveService(event, service) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      business_id: business.id,
      name: form.get('name'),
      pricing_type: form.get('pricingType'),
      default_price: Number(form.get('price')),
      active: form.get('active') === 'on'
    };
    const result = service?.id
      ? await supabase.from('services').update(payload).eq('id', service.id)
      : await supabase.from('services').insert(payload);
    if (result.error) setMessage(result.error.message);
    else {
      setModal(null);
      await refresh();
    }
  }

  async function saveBusiness(event) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name'),
      phone: form.get('phone'),
      address: form.get('address'),
      currency: form.get('currency')
    };
    const { data, error } = await supabase.from('businesses').update(payload).eq('id', business.id).select().single();
    if (error) setMessage(error.message);
    else {
      setBusiness(data);
      setMessage('Business settings saved.');
    }
  }

  if (!session && hasSupabaseConfig) {
    return <AuthScreen message={message} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <strong>FreshLedger</strong>
            <span>Laundry Suite</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}>
              <Icon name={item} />
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>{business?.name || 'Sample mode'}</strong>
          <span>{session?.user?.email || 'Sign in to use Supabase data'}</span>
          {session && <button className="ghost-button" onClick={() => supabase.auth.signOut()}>Sign out</button>}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{active === 'Dashboard' ? 'Laundry Operations' : active}</h1>
            <p>Sales, garment movement, payments, and daily performance in one place.</p>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Icon name="Search" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders, customers..." />
            </label>
            <input className="date-input" type="date" defaultValue="2026-05-07" />
            <button className="primary-button" onClick={() => setModal('order')}>
              <Icon name="Plus" />
              New Order
            </button>
          </div>
        </header>

        {isLoading && <div className="notice">Loading Supabase data...</div>}
        {message && <div className={message.includes('saved') ? 'notice' : 'notice error'}>{message}</div>}

        {active === 'Dashboard' && <Dashboard metrics={metrics} orders={filteredOrders} payments={payments} inventoryItems={inventoryItems} onAdvance={advanceOrder} onRecordPayment={(order) => { setSelectedOrder(order); setModal('payment'); }} />}
        {active === 'Orders' && <OrdersView orders={filteredOrders} onAdvance={advanceOrder} onRecordPayment={(order) => { setSelectedOrder(order); setModal('payment'); }} />}
        {active === 'Customers' && <CustomersView customers={customers} orders={orders} onNew={() => setModal('customer')} onEdit={(customer) => { setSelectedCustomer(customer); setModal('customer'); }} />}
        {active === 'Payments' && <PaymentsView payments={payments} orders={orders} onRecordPayment={(order) => { setSelectedOrder(order); setModal('payment'); }} />}
        {active === 'Inventory' && <InventoryView inventoryItems={inventoryItems} onNew={() => setModal('inventory')} onEdit={(item) => { setSelectedOrder(item); setModal('inventory'); }} />}
        {active === 'Expenses' && <ExpensesView expenses={expenseItems} onNew={() => setModal('expense')} />}
        {active === 'Reports' && <ReportsView orders={orders} payments={payments} expenses={expenseItems} />}
        {active === 'Settings' && <SettingsView business={business} services={services} members={members} onSaveBusiness={saveBusiness} onNewService={() => setModal('service')} onEditService={(service) => { setSelectedOrder(service); setModal('service'); }} />}
      </main>

      {modal === 'order' && <OrderModal onClose={() => setModal(null)} onSubmit={saveOrder} customers={customers} services={services} />}
      {modal === 'customer' && <CustomerModal customer={selectedCustomer} onClose={() => { setModal(null); setSelectedCustomer(null); }} onSubmit={saveCustomer} />}
      {modal === 'payment' && <PaymentModal order={selectedOrder} orders={orders} onClose={() => { setModal(null); setSelectedOrder(null); }} onSubmit={recordPayment} />}
      {modal === 'inventory' && <InventoryModal item={selectedOrder} onClose={() => { setModal(null); setSelectedOrder(null); }} onSubmit={saveInventory} />}
      {modal === 'expense' && <ExpenseModal onClose={() => setModal(null)} onSubmit={saveExpense} />}
      {modal === 'service' && <ServiceModal service={selectedOrder} onClose={() => { setModal(null); setSelectedOrder(null); }} onSubmit={saveService} />}
    </div>
  );
}

function AuthScreen({ message }) {
  const [mode, setMode] = useState('sign-in');
  const [status, setStatus] = useState(message || '');

  async function submitAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get('email');
    const password = form.get('password');
    const fullName = form.get('fullName');
    setStatus('');
    const result = mode === 'sign-up'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setStatus(formatAuthError(result.error.message));
    else if (mode === 'sign-up' && !result.data.session) setStatus('Account created. Check the email inbox if confirmation is enabled.');
  }

  async function resetPassword(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setStatus(error ? formatAuthError(error.message) : 'Password reset email sent.');
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">F</div>
          <div>
            <strong>FreshLedger</strong>
            <span>Supabase-backed laundry management</span>
          </div>
        </div>
        <h1>{mode === 'reset' ? 'Reset password' : mode === 'sign-up' ? 'Create your laundry workspace' : 'Sign in to FreshLedger'}</h1>
        <p>Auth protects each business workspace, and Row Level Security keeps records scoped to members.</p>
        {mode === 'reset' ? (
          <form onSubmit={resetPassword} className="auth-form">
            <label>Email<input name="email" required type="email" placeholder="you@example.com" /></label>
            {status && <div className="notice error">{status}</div>}
            <button className="primary-button" type="submit">Send reset email</button>
          </form>
        ) : (
          <form onSubmit={submitAuth} className="auth-form">
            {mode === 'sign-up' && <label>Full name<input name="fullName" required placeholder="Your name" /></label>}
            <label>Email<input name="email" required type="email" placeholder="you@example.com" /></label>
            <label>Password<input name="password" required type="password" minLength="6" placeholder="At least 6 characters" /></label>
            {status && <div className="notice error">{status}</div>}
            <button className="primary-button" type="submit">{mode === 'sign-up' ? 'Create account' : 'Sign in'}</button>
          </form>
        )}
        <div className="auth-links">
          <button className="link-button" onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}>
            {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
          </button>
          <button className="link-button" onClick={() => setMode(mode === 'reset' ? 'sign-in' : 'reset')}>Forgot password?</button>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ metrics, orders, payments, inventoryItems, onAdvance, onRecordPayment }) {
  return (
    <div className="dashboard-grid">
      <section className="metric-strip">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.trend}</small>
          </div>
        ))}
      </section>
      <section className="pipeline panel">
        <div className="section-head">
          <div>
            <h2>Order Pipeline</h2>
            <p>Move jobs forward as garments complete each station.</p>
          </div>
          <span>{orders.length} visible orders</span>
        </div>
        <div className="pipeline-columns">
          {pipelineStatuses.map((status) => (
            <div className="pipeline-column" key={status}>
              <div className="column-title">{status}<span>{orders.filter((order) => order.status === status).length}</span></div>
              {orders.filter((order) => order.status === status).map((order) => (
                <OrderCard key={order.id} order={order} onAdvance={onAdvance} onRecordPayment={onRecordPayment} />
              ))}
            </div>
          ))}
        </div>
      </section>
      <aside className="right-rail">
        <Panel title="Pickup & Delivery">
          {orders.filter((order) => order.delivery === 'delivery' || order.status === 'Ready').slice(0, 4).map((order) => (
            <Task key={order.id} customer={order.customer} detail={`${order.delivery === 'delivery' ? 'Delivery' : 'Pickup'} - ${order.id}`} time={order.due} tone={order.status === 'Ready' ? 'green' : 'teal'} />
          ))}
        </Panel>
        <Panel title="Low Stock Alerts">
          {inventoryItems.filter((item) => item.stock < item.level).map((item) => (
            <div className="stock-row" key={item.name}>
              <span>{item.name}</span>
              <strong>{item.stock} {item.unit}</strong>
            </div>
          ))}
        </Panel>
      </aside>
      <section className="panel payments-panel">
        <div className="section-head">
          <h2>Recent Payments</h2>
          <span>Latest</span>
        </div>
        <PaymentsTable payments={payments.slice(0, 5)} />
      </section>
      <section className="panel chart-panel">
        <div className="section-head">
          <h2>Revenue Trend</h2>
          <span>7 days</span>
        </div>
        <div className="chart">
          {[44, 56, 38, 72, 68, 81, 63].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order, onAdvance, onRecordPayment }) {
  const balance = orderBalance(order);
  return (
    <article className="order-card">
      <div className="order-card-top">
        <strong>{order.customer}</strong>
        <span>{order.id}</span>
      </div>
      <p>{order.service} · {order.items} items</p>
      <div className="order-meta">
        <span>{order.due}</span>
        <span>{currency(order.amount)}</span>
      </div>
      <div className="order-footer">
        <small className={balance ? 'balance due' : 'balance paid'}>{balance ? `${currency(balance)} due` : 'Paid'}</small>
        {balance > 0 && <button onClick={() => onRecordPayment(order)}>Pay</button>}
        <button onClick={() => onAdvance(order.id)} disabled={order.status === 'Ready'}>Advance</button>
      </div>
    </article>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <div className="section-head compact">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Task({ customer, detail, time, tone }) {
  return (
    <div className={`task ${tone}`}>
      <div>
        <strong>{customer}</strong>
        <span>{detail}</span>
      </div>
      <small>{time}</small>
    </div>
  );
}

function OrdersView({ orders, onAdvance, onRecordPayment }) {
  return (
    <section className="panel full-view">
      <DataHeader title="All Orders" detail="Track status, balances, staff owner, and due times." />
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Service</th><th>Status</th><th>Due</th><th>Total</th><th>Balance</th><th>Flow</th><th></th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td><td>{order.customer}</td><td>{order.service}</td>
              <td><Status value={order.status} /></td><td>{order.due}</td><td>{currency(order.amount)}</td><td>{currency(orderBalance(order))}</td>
              <td><select value={order.status} onChange={(event) => onAdvance(order.id, event.target.value)}>{fullStatuses.map((status) => <option key={status}>{status}</option>)}</select></td>
              <td>{orderBalance(order) > 0 && <button className="table-button" onClick={() => onRecordPayment(order)}>Record payment</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CustomersView({ customers, orders, onNew, onEdit }) {
  return (
    <section className="panel full-view">
      <div className="section-head">
        <DataHeader title="Customers" detail="Customer profiles with order count and current balance." />
        <button className="primary-button" onClick={onNew}><Icon name="Plus" /> New Customer</button>
      </div>
      <div className="record-grid">
        {customers.map((customer) => (
          <article className="record-card" key={customer.id}>
            <strong>{customer.name}</strong>
            <span>{customer.type} · {customer.phone || 'No phone'}</span>
            <p>{customer.address || 'No address'}</p>
            <div><small>{orders.filter((order) => order.customer === customer.name).length} orders</small><small>{currency(customer.balance)} balance</small></div>
            <button className="table-button" onClick={() => onEdit(customer)}>Edit customer</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaymentsView({ payments, orders, onRecordPayment }) {
  return (
    <section className="panel full-view">
      <div className="section-head">
        <DataHeader title="Payments" detail="Cash, mobile money, bank transfer, and card collections." />
        <select onChange={(event) => {
          const order = orders.find((item) => item.dbId === event.target.value);
          if (order) onRecordPayment(order);
        }} defaultValue="">
          <option value="" disabled>Record payment for...</option>
          {orders.filter((order) => orderBalance(order) > 0).map((order) => <option key={order.dbId} value={order.dbId}>{order.id} - {order.customer}</option>)}
        </select>
      </div>
      <PaymentsTable payments={payments} />
    </section>
  );
}

function InventoryView({ inventoryItems, onNew, onEdit }) {
  return (
    <section className="panel full-view">
      <div className="section-head">
        <DataHeader title="Inventory" detail="Monitor consumables and reorder levels." />
        <button className="primary-button" onClick={onNew}><Icon name="Plus" /> Add Item</button>
      </div>
      <div className="record-grid">
        {inventoryItems.map((item) => (
          <article className="record-card" key={item.id || item.name}>
            <strong>{item.name}</strong>
            <span>{item.stock} {item.unit} available</span>
            <div className="meter"><i style={{ width: `${Math.min(100, (item.stock / Math.max(item.level, 1)) * 100)}%` }} /></div>
            <p>Reorder level: {item.level} {item.unit}</p>
            <button className="table-button" onClick={() => onEdit(item)}>Update stock</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExpensesView({ expenses, onNew }) {
  return (
    <section className="panel full-view">
      <div className="section-head">
        <DataHeader title="Expenses" detail="Operating costs for profit visibility." />
        <button className="primary-button" onClick={onNew}><Icon name="Plus" /> Add Expense</button>
      </div>
      <table>
        <thead><tr><th>Category</th><th>Amount</th><th>Date</th><th>Notes</th></tr></thead>
        <tbody>{expenses.map((expense) => <tr key={expense.id || `${expense.category}-${expense.date}`}><td>{expense.category}</td><td>{currency(expense.amount)}</td><td>{expense.date}</td><td>{expense.owner}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function ReportsView({ orders, payments, expenses }) {
  const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const expected = orders.reduce((sum, order) => sum + order.amount, 0);
  const costs = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return (
    <section className="panel full-view">
      <DataHeader title="Reports" detail="Revenue, performance, and outstanding balance summaries." />
      <div className="report-grid">
        <div><span>Collected Revenue</span><strong>{currency(revenue)}</strong></div>
        <div><span>Expected Order Value</span><strong>{currency(expected)}</strong></div>
        <div><span>Expenses</span><strong>{currency(costs)}</strong></div>
        <div><span>Estimated Profit</span><strong>{currency(revenue - costs)}</strong></div>
      </div>
      <div className="chart tall-chart">{[44, 56, 38, 72, 68, 81, 63].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
    </section>
  );
}

function SettingsView({ business, services, members, onSaveBusiness, onNewService, onEditService }) {
  return (
    <section className="settings-grid">
      <form className="panel settings-form" onSubmit={onSaveBusiness}>
        <DataHeader title="Business Profile" detail="Receipt and workspace details." />
        <label>Name<input name="name" defaultValue={business?.name || ''} /></label>
        <label>Phone<input name="phone" defaultValue={business?.phone || ''} /></label>
        <label>Address<input name="address" defaultValue={business?.address || ''} /></label>
        <label>Currency<input name="currency" defaultValue={business?.currency || 'GHS'} /></label>
        <button className="primary-button" type="submit">Save business</button>
      </form>
      <section className="panel">
        <div className="section-head">
          <DataHeader title="Services & Price List" detail="Services used in order creation." />
          <button className="primary-button" onClick={onNewService}><Icon name="Plus" /> Add Service</button>
        </div>
        <table>
          <thead><tr><th>Service</th><th>Pricing</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>{services.map((service) => <tr key={service.id}><td>{service.name}</td><td>{service.pricing_type}</td><td>{currency(service.default_price)}</td><td>{service.active ? 'Active' : 'Inactive'}</td><td><button className="table-button" onClick={() => onEditService(service)}>Edit</button></td></tr>)}</tbody>
        </table>
      </section>
      <section className="panel">
        <DataHeader title="Team Members" detail="Current workspace membership." />
        <table>
          <thead><tr><th>User ID</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>{members.map((member) => <tr key={member.id}><td>{member.user_id}</td><td>{member.role}</td><td>{new Date(member.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </section>
    </section>
  );
}

function PaymentsTable({ payments }) {
  return (
    <table>
      <thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Time</th></tr></thead>
      <tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.id}</td><td>{payment.order}</td><td>{payment.customer}</td><td>{payment.method}</td><td>{currency(payment.amount)}</td><td>{payment.time}</td></tr>)}</tbody>
    </table>
  );
}

function DataHeader({ title, detail }) {
  return (
    <div className="data-header">
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

function Status({ value }) {
  return <span className={`status ${String(value).toLowerCase()}`}>{value}</span>;
}

function ModalFrame({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OrderModal({ onClose, onSubmit, customers, services }) {
  return (
    <ModalFrame title="Create Laundry Order" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label>Existing Customer<select name="customerId" defaultValue=""><option value="">Walk-in / new customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label>New Customer Name<input name="customerName" placeholder="Use when customer is new" /></label>
          <label>New Customer Phone<input name="customerPhone" placeholder="Optional" /></label>
          <label>Service<select name="service">{services.filter((service) => service.active !== false).map((service) => <option key={service.id}>{service.name}</option>)}</select></label>
          <label>Items<input name="items" required type="number" min="1" defaultValue="4" /></label>
          <label>Total Amount<input name="amount" required type="number" min="0" defaultValue="120" /></label>
          <label>Amount Paid<input name="paid" required type="number" min="0" defaultValue="0" /></label>
          <label>Payment Method<select name="method"><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option></select></label>
          <label>Status<select name="status">{fullStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Pickup / Delivery<select name="delivery"><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label>
          <label>Staff Owner<input name="owner" defaultValue="Reception" /></label>
          <label>Due Time<input name="due" required defaultValue="Tomorrow 2:00 PM" /></label>
        </div>
        <button className="primary-button submit-button" type="submit">Save Order</button>
      </form>
    </ModalFrame>
  );
}

function CustomerModal({ customer, onClose, onSubmit }) {
  return (
    <ModalFrame title={customer ? 'Edit Customer' : 'Add Customer'} onClose={onClose}>
      <form onSubmit={(event) => onSubmit(event, customer)}>
        <div className="form-grid">
          <label>Name<input name="name" required defaultValue={customer?.name || ''} /></label>
          <label>Phone<input name="phone" defaultValue={customer?.phone || ''} /></label>
          <label>Type<select name="type" defaultValue={customer?.type || 'Regular'}><option>Regular</option><option>VIP</option><option>Corporate</option><option>Hotel</option><option>Walk-in</option></select></label>
          <label>Address<input name="address" defaultValue={customer?.address || ''} /></label>
          <label className="wide">Notes<input name="notes" defaultValue={customer?.notes || ''} /></label>
        </div>
        <button className="primary-button submit-button" type="submit">Save Customer</button>
      </form>
    </ModalFrame>
  );
}

function PaymentModal({ order, orders, onClose, onSubmit }) {
  return (
    <ModalFrame title="Record Payment" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label>Order<select name="orderDbId" defaultValue={order?.dbId || ''}>{orders.filter((item) => orderBalance(item) > 0).map((item) => <option key={item.dbId} value={item.dbId}>{item.id} - {item.customer} ({currency(orderBalance(item))} due)</option>)}</select></label>
          <label>Amount<input name="amount" required type="number" min="1" defaultValue={order ? orderBalance(order) : 50} /></label>
          <label>Method<select name="method"><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option></select></label>
          <label>Notes<input name="notes" placeholder="Optional" /></label>
        </div>
        <button className="primary-button submit-button" type="submit">Record Payment</button>
      </form>
    </ModalFrame>
  );
}

function InventoryModal({ item, onClose, onSubmit }) {
  return (
    <ModalFrame title={item ? 'Update Inventory' : 'Add Inventory Item'} onClose={onClose}>
      <form onSubmit={(event) => onSubmit(event, item)}>
        <div className="form-grid">
          <label>Name<input name="name" required defaultValue={item?.name || ''} /></label>
          <label>Stock<input name="stock" required type="number" min="0" defaultValue={item?.stock || 0} /></label>
          <label>Reorder Level<input name="level" required type="number" min="0" defaultValue={item?.level || 0} /></label>
          <label>Unit<input name="unit" required defaultValue={item?.unit || 'pcs'} /></label>
          <label>Unit Cost<input name="cost" type="number" min="0" defaultValue={item?.cost || 0} /></label>
          <label>Supplier<input name="supplier" defaultValue={item?.supplier || ''} /></label>
        </div>
        <button className="primary-button submit-button" type="submit">Save Inventory</button>
      </form>
    </ModalFrame>
  );
}

function ExpenseModal({ onClose, onSubmit }) {
  return (
    <ModalFrame title="Add Expense" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <label>Category<input name="category" required placeholder="Electricity, rent, detergent..." /></label>
          <label>Amount<input name="amount" required type="number" min="0" /></label>
          <label>Date<input name="date" required type="date" defaultValue={todayIso()} /></label>
          <label>Description<input name="description" placeholder="Optional notes" /></label>
        </div>
        <button className="primary-button submit-button" type="submit">Save Expense</button>
      </form>
    </ModalFrame>
  );
}

function ServiceModal({ service, onClose, onSubmit }) {
  return (
    <ModalFrame title={service ? 'Edit Service' : 'Add Service'} onClose={onClose}>
      <form onSubmit={(event) => onSubmit(event, service)}>
        <div className="form-grid">
          <label>Name<input name="name" required defaultValue={service?.name || ''} /></label>
          <label>Pricing Type<select name="pricingType" defaultValue={service?.pricing_type || 'item'}><option value="item">Item</option><option value="weight">Weight</option><option value="package">Package</option></select></label>
          <label>Default Price<input name="price" required type="number" min="0" defaultValue={service?.default_price || 0} /></label>
          <label className="check-row"><input name="active" type="checkbox" defaultChecked={service?.active ?? true} /> Active service</label>
        </div>
        <button className="primary-button submit-button" type="submit">Save Service</button>
      </form>
    </ModalFrame>
  );
}

createRoot(document.getElementById('root')).render(<App />);
