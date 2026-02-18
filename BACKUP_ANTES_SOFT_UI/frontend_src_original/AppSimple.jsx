// Versión simple de App para diagnóstico
import { useState } from 'react';

function AppSimple() {
  const [mensaje, setMensaje] = useState('Sistema funcionando');

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2563eb', fontSize: '32px', marginBottom: '20px' }}>
        Casa de Repuestos - Test de Conexión
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#16a34a', marginBottom: '15px' }}>
          ✓ Frontend funcionando correctamente
        </h2>
        
        <p style={{ color: '#666', marginBottom: '10px' }}>
          {mensaje}
        </p>
        
        <button 
          onClick={() => setMensaje('¡React funciona! Hora: ' + new Date().toLocaleTimeString())}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '15px'
          }}
        >
          Probar React
        </button>
        
        <hr style={{ margin: '30px 0', border: '1px solid #ddd' }} />
        
        <h3 style={{ color: '#666', marginBottom: '10px' }}>
          Si ves esto, el problema está en:
        </h3>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li>Algún componente específico (Login, Dashboard, etc.)</li>
          <li>El contexto de autenticación</li>
          <li>Las rutas de React Router</li>
        </ul>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#fef3c7',
          borderRadius: '6px'
        }}>
          <strong style={{ color: '#92400e' }}>Siguiente paso:</strong>
          <p style={{ color: '#92400e', margin: '10px 0 0 0' }}>
            Presiona F12 y ve a la pestaña "Console" para ver errores específicos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AppSimple;
