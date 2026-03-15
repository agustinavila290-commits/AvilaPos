import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" className="logo-avila" style={{ color: 'white', textDecoration: 'none' }}>
            <span className="letra-a">A</span><span className="resto">VILA</span>
          </Link>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Admin tienda</span>
        </div>
        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/pedidos">Pedidos</Link>
          <Link to="/admin/productos">Productos</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <span style={{ fontSize: '0.8rem' }}>{user?.username}</span>
          <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
      <style>{`
        .admin-layout { display: flex; min-height: 100vh; }
        .admin-sidebar {
          width: 240px; background: var(--avila-negro); color: white;
          display: flex; flex-direction: column; padding: 1rem 0;
        }
        .admin-sidebar-header { padding: 0 1rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .admin-nav { flex: 1; padding: 1rem 0; }
        .admin-nav a {
          display: block; padding: 0.5rem 1rem; color: rgba(255,255,255,0.9);
          text-decoration: none; transition: background 0.2s;
        }
        .admin-nav a:hover, .admin-nav a.active { background: rgba(255,255,255,0.1); color: white; }
        .admin-sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 0.5rem; }
        .admin-main { flex: 1; padding: 2rem; background: var(--avila-gris-claro); overflow-auto; }
        .admin-main .btn-outline { color: white; border-color: rgba(255,255,255,0.5); }
        .admin-main .btn-outline:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
