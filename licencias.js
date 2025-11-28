// ============================================
// SISTEMA DE LICENCIAS Y PROTECCIÓN
// Versión: 1.0
// ============================================

// Configuración del sistema
const CONFIG_LICENCIA = {
    appName: 'Sistema de Restaurante Pro',
    version: '3.0',
    licenciaRequerida: true,
    seedSecreto: "ClaveSecreta_Gabriel_2025_ZXC987",  // ⚠️ CÁMBIALA
    tiempoDemo: 0 // ← SIN DEMO, requiere licencia desde el día 1
};

// Almacenamiento de licencia
const STORAGE_LICENCIA = 'app_licencia';
const STORAGE_ACTIVACION = 'app_activacion_fecha';
const STORAGE_DISPOSITIVO_ID = 'app_dispositivo_id';

// ============================================
// FUNCIONES DE ENCRIPTACIÓN
// ============================================

// Función simple de hash (SHA-256 simulado)
async function hashSHA256(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Generar ID único del dispositivo
// Generar ID único del dispositivo (más difícil de burlar)
function generarDispositivoID() {
    let deviceId = localStorage.getItem(STORAGE_DISPOSITIVO_ID);
    
    if (!deviceId) {
        // Crear un ID único basado en características del navegador
        const navegador = navigator.userAgent;
        const idioma = navigator.language;
        const plataforma = navigator.platform;
        const pantalla = `${screen.width}x${screen.height}x${screen.colorDepth}`;
        const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        
        // ⭐ NUEVO: Incluir más datos del navegador para hacer un "fingerprint"
        const cadena = `${navegador}-${idioma}-${plataforma}-${pantalla}-${zonaHoraria}-${timestamp}-${random}`;
        deviceId = btoa(cadena).substring(0, 32);
        
        localStorage.setItem(STORAGE_DISPOSITIVO_ID, deviceId);
        
        // ⭐ NUEVO: También guardarlo en IndexedDB como respaldo
        try {
            const request = indexedDB.open('LicenciaDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('dispositivo')) {
                    db.createObjectStore('dispositivo');
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('dispositivo', 'readwrite');
                const store = tx.objectStore('dispositivo');
                store.put(deviceId, 'id');
            };
        } catch (error) {
            console.warn('No se pudo guardar en IndexedDB:', error);
        }
    }
    
    return deviceId;
}

// ============================================
// GENERACIÓN Y VALIDACIÓN DE LICENCIAS
// ============================================

// Generar clave de licencia (SOLO PARA TI - usa generador-claves.html)
async function generarClaveLicencia(nombreCliente, numeroLicencia) {
    const dispositivo = 'ANY'; // ANY = funciona en cualquier dispositivo
    const expiracion = 'NEVER'; // NEVER = sin expiración
    
    const cadena = `${nombreCliente}-${numeroLicencia}-${dispositivo}-${expiracion}-${CONFIG_LICENCIA.seedSecreto}`;
    const hash = await hashSHA256(cadena);
    
    // Formato: XXXX-XXXX-XXXX-XXXX
    const parte1 = hash.substring(0, 4).toUpperCase();
    const parte2 = hash.substring(4, 8).toUpperCase();
    const parte3 = hash.substring(8, 12).toUpperCase();
    const parte4 = hash.substring(12, 16).toUpperCase();
    
    const clave = `${parte1}-${parte2}-${parte3}-${parte4}`;
    
    return {
        clave: clave,
        nombreCliente: nombreCliente,
        numeroLicencia: numeroLicencia,
        dispositivo: dispositivo,
        expiracion: expiracion,
        fechaGeneracion: new Date().toISOString()
    };
}

// Validar clave de licencia
async function validarClaveLicencia(claveIngresada, nombreCliente, numeroLicencia) {
    const claveEsperada = await generarClaveLicencia(nombreCliente, numeroLicencia);
    return claveIngresada.toUpperCase().replace(/\s/g, '') === claveEsperada.clave.replace(/-/g, '');
}

// ============================================
// ACTIVACIÓN DE LICENCIA
// ============================================

async function activarLicencia(claveIngresada, nombreCliente, numeroLicencia) {
    try {
        // Limpiar clave
        const claveLimpia = claveIngresada.toUpperCase().replace(/[\s-]/g, '');
        
        // Validar formato
        if (claveLimpia.length !== 16 || !/^[0-9A-F]+$/.test(claveLimpia)) {
            return {
                valida: false,
                mensaje: 'Formato de clave inválido. Debe tener el formato: XXXX-XXXX-XXXX-XXXX'
            };
        }
        
        // Generar clave esperada
        const licenciaEsperada = await generarClaveLicencia(nombreCliente, numeroLicencia);
        const claveEsperada = licenciaEsperada.clave.replace(/-/g, '');
        
        // Validar
        if (claveLimpia === claveEsperada) {
            // ⭐ NUEVO: Verificar cuántos dispositivos ya tienen esta licencia
            const dispositivoActual = generarDispositivoID();
            
            // Obtener lista de dispositivos registrados con esta licencia
            const keyDispositivos = `licencia_dispositivos_${numeroLicencia}`;
            const dispositivosRegistrados = JSON.parse(localStorage.getItem(keyDispositivos) || '[]');
            
            // ⭐ CONFIGURACIÓN: Máximo de dispositivos permitidos
            const MAX_DISPOSITIVOS = 1; // Cambiar a 3 para permitir 3 dispositivos
            
            // Verificar si este dispositivo ya está registrado
            const yaRegistrado = dispositivosRegistrados.find(d => d.id === dispositivoActual);
            
            if (!yaRegistrado && dispositivosRegistrados.length >= MAX_DISPOSITIVOS) {
                // Ya hay MAX_DISPOSITIVOS dispositivos usando esta licencia
                return {
                    valida: false,
                    mensaje: `Esta licencia ya está activa en ${MAX_DISPOSITIVOS} dispositivo(s). Solo se permite ${MAX_DISPOSITIVOS} dispositivo(s) simultáneo(s).`,
                    tipo: 'limite_dispositivos'
                };
            }
            
            // Registrar este dispositivo
            if (!yaRegistrado) {
                dispositivosRegistrados.push({
                    id: dispositivoActual,
                    nombre: `${navigator.platform} - ${navigator.userAgent.substring(0, 50)}`,
                    fechaActivacion: new Date().toISOString()
                });
                localStorage.setItem(keyDispositivos, JSON.stringify(dispositivosRegistrados));
            }
            
            // Guardar licencia
            const licenciaData = {
                clave: claveIngresada.toUpperCase(),
                nombreCliente: nombreCliente,
                numeroLicencia: numeroLicencia,
                dispositivo: dispositivoActual,
                fechaActivacion: new Date().toISOString(),
                valida: true,
                suspendida: false // ⭐ NUEVO: Campo para suspender
            };
            
            localStorage.setItem(STORAGE_LICENCIA, JSON.stringify(licenciaData));
            localStorage.setItem(STORAGE_ACTIVACION, Date.now().toString());
            
            return {
                valida: true,
                mensaje: '¡Licencia activada correctamente! Bienvenido.',
                licencia: licenciaData
            };
        } else {
            return {
                valida: false,
                mensaje: 'Clave de licencia incorrecta. Verifica que la hayas ingresado correctamente.'
            };
        }
        
    } catch (error) {
        console.error('Error al activar licencia:', error);
        return {
            valida: false,
            mensaje: 'Error al procesar la licencia. Contacta al soporte.'
        };
    }
}

// ============================================
// VERIFICACIÓN DE LICENCIA
// ============================================

function verificarLicencia() {
    try {
        // Obtener licencia guardada
        const licenciaJSON = localStorage.getItem(STORAGE_LICENCIA);
        const fechaActivacion = localStorage.getItem(STORAGE_ACTIVACION);
        
        // Si NO hay licencia registrada
        if (!licenciaJSON) {
            // Verificar período de demo
            if (!fechaActivacion) {
                // Primera vez - iniciar demo si está permitido
                if (CONFIG_LICENCIA.tiempoDemo > 0) {
                    localStorage.setItem(STORAGE_ACTIVACION, Date.now().toString());
                    return {
                        activa: true,
                        tipo: 'demo',
                        diasRestantes: CONFIG_LICENCIA.tiempoDemo,
                        mensaje: `Período de prueba: ${CONFIG_LICENCIA.tiempoDemo} días`
                    };
                } else {
                    // NO hay demo permitido
                    return {
                        activa: false,
                        tipo: 'sin_licencia',
                        mensaje: 'Requiere activación de licencia'
                    };
                }
            }
            
            // Ya usó demo antes - verificar si expiró
            return verificarPeriodoDemo();
        }
        
        // Hay licencia guardada - validarla
        const licencia = JSON.parse(licenciaJSON);
        
        // ⭐ VALIDACIÓN 1: Verificar integridad de campos
        if (!licencia.clave || !licencia.numeroLicencia || !licencia.nombreCliente) {
            console.error('❌ Licencia corrupta o incompleta');
            localStorage.removeItem(STORAGE_LICENCIA); // Eliminar licencia corrupta
            return {
                activa: false,
                tipo: 'invalida',
                mensaje: 'Licencia corrupta. Por favor, reactiva tu licencia.'
            };
        }
        
        // ⭐ VALIDACIÓN 2: Verificar que tenga el campo valida en true
        if (licencia.valida !== true) {
            console.error('❌ Licencia marcada como inválida');
            localStorage.removeItem(STORAGE_LICENCIA);
            return {
                activa: false,
                tipo: 'invalida',
                mensaje: 'Licencia inválida. Por favor, reactiva tu licencia.'
            };
        }
        
        // ⭐ VALIDACIÓN 3: Verificar si está suspendida localmente
        if (licencia.suspendida === true) {
            return {
                activa: false,
                tipo: 'suspendida',
                mensaje: 'Tu licencia ha sido suspendida. Contacta al soporte.'
            };
        }
        
        // ⭐ VALIDACIÓN 4: Verificar suspensión en servidor (asíncrono)
        // Esta verificación NO bloquea el inicio, pero detecta suspensiones nuevas
        verificarSuspension(licencia.numeroLicencia).then(resultado => {
            if (resultado.suspendida) {
                // Marcar como suspendida localmente
                licencia.suspendida = true;
                localStorage.setItem(STORAGE_LICENCIA, JSON.stringify(licencia));
                
                // Forzar recarga para que se bloquee
                alert(`⚠️ Tu licencia ha sido suspendida.\nRazón: ${resultado.razon}\nContacta al soporte.`);
                window.location.reload();
            }
        }).catch(error => {
            // Error al verificar suspensión - continuar normalmente (modo offline)
            console.warn('⚠️ No se pudo verificar suspensión:', error);
        });
        
        // ⭐ Licencia válida y activa
        return {
            activa: true,
            tipo: 'licencia',
            licencia: licencia,
            mensaje: 'Licencia activa'
        };
        
    } catch (error) {
        console.error('Error al verificar licencia:', error);
        // En caso de error, limpiar y pedir licencia
        localStorage.removeItem(STORAGE_LICENCIA);
        return {
            activa: false,
            tipo: 'error',
            mensaje: 'Error al verificar la licencia. Por favor, reactiva.'
        };
    }
}

function verificarPeriodoDemo() {
    const fechaActivacion = localStorage.getItem(STORAGE_ACTIVACION);
    
    if (!fechaActivacion) {
        // Primera vez usando la app, iniciar período de demo
        localStorage.setItem(STORAGE_ACTIVACION, Date.now().toString());
        return {
            activa: true,
            tipo: 'demo',
            diasRestantes: CONFIG_LICENCIA.tiempoDemo,
            mensaje: `Período de prueba: ${CONFIG_LICENCIA.tiempoDemo} días`
        };
    }
    
    const fechaInicio = parseInt(fechaActivacion);
    const ahora = Date.now();
    const diasTranscurridos = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
    const diasRestantes = CONFIG_LICENCIA.tiempoDemo - diasTranscurridos;
    
    if (diasRestantes > 0) {
        return {
            activa: true,
            tipo: 'demo',
            diasRestantes: diasRestantes,
            mensaje: `Período de prueba: ${diasRestantes} días restantes`
        };
    } else {
        return {
            activa: false,
            tipo: 'demo_expirado',
            mensaje: 'El período de prueba ha expirado. Activa tu licencia.'
        };
    }
}

// Obtener información de licencia para mostrar
function obtenerInfoLicencia() {
    const verificacion = verificarLicencia();
    
    if (verificacion.tipo === 'licencia') {
        return {
            tipo: 'Licencia Completa',
            numero: verificacion.licencia.numeroLicencia,
            cliente: verificacion.licencia.nombreCliente,
            activa: true
        };
    } else if (verificacion.tipo === 'demo') {
        return {
            tipo: 'Período de Prueba',
            numero: 'DEMO',
            cliente: 'Usuario de Prueba',
            diasRestantes: verificacion.diasRestantes,
            activa: true
        };
    } else {
        return {
            tipo: 'Sin Licencia',
            numero: 'N/A',
            cliente: 'No activado',
            activa: false
        };
    }
}

// ============================================
// MARCA DE AGUA
// ============================================

function mostrarMarcaDeAgua() {
    const infoLicencia = obtenerInfoLicencia();
    
    // Crear elemento de marca de agua si no existe
    let marcaAgua = document.getElementById('marca-agua-licencia');
    
    if (!marcaAgua) {
        marcaAgua = document.createElement('div');
        marcaAgua.id = 'marca-agua-licencia';
        marcaAgua.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 11px;
            font-family: monospace;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
        `;
        document.body.appendChild(marcaAgua);
    }
    
    if (infoLicencia.tipo === 'Licencia Completa') {
        marcaAgua.textContent = `📜 Licencia #${infoLicencia.numero}`;
        marcaAgua.style.background = 'rgba(16, 185, 129, 0.8)';
    } else if (infoLicencia.tipo === 'Período de Prueba') {
        marcaAgua.textContent = `⏱️ Demo: ${infoLicencia.diasRestantes} días`;
        marcaAgua.style.background = 'rgba(245, 158, 11, 0.8)';
    } else {
        marcaAgua.textContent = '❌ Sin Licencia';
        marcaAgua.style.background = 'rgba(239, 68, 68, 0.8)';
    }
}

// ============================================
// PANTALLA DE ACTIVACIÓN
// ============================================

function mostrarPantallaActivacion(motivo = 'requerida') {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'overlay-activacion';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    let mensajeMotivo = '';
    if (motivo === 'demo_expirado') {
        mensajeMotivo = '<p style="color: #fbbf24; margin-bottom: 20px;">⏱️ Tu período de prueba ha expirado.</p>';
    } else if (motivo === 'invalida') {
        mensajeMotivo = '<p style="color: #f87171; margin-bottom: 20px;">❌ Licencia inválida o corrupta.</p>';
    }
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h1 style="margin: 0 0 10px 0; color: #1f2937; text-align: center;">
                🍽️ ${CONFIG_LICENCIA.appName}
            </h1>
            <p style="margin: 0 0 30px 0; color: #6b7280; text-align: center; font-size: 14px;">
                Versión ${CONFIG_LICENCIA.version}
            </p>
            
            ${mensajeMotivo}
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Activar Licencia</h3>
                
                <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                    Nombre del Cliente:
                </label>
                <input type="text" id="input-nombre-cliente" placeholder="Ej: Restaurante El Buen Sabor" 
                       style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
                
                <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                    Número de Licencia:
                </label>
                <input type="number" id="input-numero-licencia" placeholder="Ej: 12345" 
                       style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
                
                <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                    Clave de Activación:
                </label>
                <input type="text" id="input-clave-licencia" placeholder="XXXX-XXXX-XXXX-XXXX" maxlength="19"
                       style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 16px; font-family: monospace; letter-spacing: 2px; text-transform: uppercase; box-sizing: border-box;">
                
                <p id="mensaje-activacion" style="margin: 10px 0; color: #ef4444; font-size: 13px; min-height: 20px;"></p>
                
                <button onclick="procesarActivacion()" 
                        style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px;">
                    ✅ Activar Licencia
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    ¿No tienes una licencia? Contacta al vendedor.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-formatear clave mientras escribe
    const inputClave = document.getElementById('input-clave-licencia');
    inputClave.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/[^0-9A-F]/gi, '').toUpperCase();
        let formatado = '';
        for (let i = 0; i < valor.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) {
                formatado += '-';
            }
            formatado += valor[i];
        }
        e.target.value = formatado;
    });
}

async function procesarActivacion() {
    const nombreCliente = document.getElementById('input-nombre-cliente').value.trim();
    const numeroLicencia = document.getElementById('input-numero-licencia').value.trim();
    const clave = document.getElementById('input-clave-licencia').value.trim();
    const mensaje = document.getElementById('mensaje-activacion');
    
    if (!nombreCliente || !numeroLicencia || !clave) {
        mensaje.textContent = '⚠️ Por favor completa todos los campos.';
        mensaje.style.color = '#f59e0b';
        return;
    }
    
    mensaje.textContent = '⏳ Validando licencia...';
    mensaje.style.color = '#3b82f6';
    
    const resultado = await activarLicencia(clave, nombreCliente, numeroLicencia);
    
    if (resultado.valida) {
        mensaje.textContent = '✅ ' + resultado.mensaje;
        mensaje.style.color = '#10b981';
        
        setTimeout(() => {
            const overlay = document.getElementById('overlay-activacion');
            if (overlay) {
                overlay.remove();
            }
            mostrarMarcaDeAgua();
            location.reload(); // Recargar app para aplicar licencia
        }, 1500);
    } else {
        mensaje.textContent = '❌ ' + resultado.mensaje;
        mensaje.style.color = '#ef4444';
    }
}

// Hacer función disponible globalmente
window.procesarActivacion = procesarActivacion;

// ============================================
// INICIALIZACIÓN DEL SISTEMA DE LICENCIAS
// ============================================

function inicializarSistemaLicencias() {
    console.log('🔐 Inicializando sistema de licencias...');
    
    const verificacion = verificarLicencia();
    
    if (!verificacion.activa) {
        console.warn('⚠️ Licencia inactiva:', verificacion.mensaje);
        mostrarPantallaActivacion(verificacion.tipo);
        return false; // NO PERMITE CONTINUAR
    }
    
    console.log('✅ Licencia activa:', verificacion.mensaje);
    mostrarMarcaDeAgua();
    return true; // PERMITE CONTINUAR
}

// ⭐ NUEVO: Verificar si la licencia está suspendida
async function verificarSuspension(numeroLicencia) {
    try {
        // URL de tu servidor donde está el archivo JSON
        const URL_LICENCIAS_SUSPENDIDAS = 'https://warm-mandazi-5be958.netlify.app/licencias-suspendidas.json';
        
        const response = await fetch(URL_LICENCIAS_SUSPENDIDAS, {
            cache: 'no-cache' // No usar cache para obtener siempre la versión más reciente
        });
        
        if (!response.ok) {
            // Si no se puede verificar, permitir continuar (modo offline)
            console.warn('⚠️ No se pudo verificar suspensiones, continuando en modo offline');
            return { suspendida: false };
        }
        
        const data = await response.json();
        
        // Buscar si esta licencia está suspendida
        const licenciaSuspendida = data.licencias_suspendidas.find(
            l => l.numero === numeroLicencia.toString()
        );
        
        if (licenciaSuspendida) {
            return {
                suspendida: true,
                razon: licenciaSuspendida.razon,
                fecha: licenciaSuspendida.fecha_suspension
            };
        }
        
        return { suspendida: false };
        
    } catch (error) {
        console.error('Error al verificar suspensiones:', error);
        // En caso de error, permitir continuar (modo offline)
        return { suspendida: false };
    }
}

// IMPORTANTE: Exportar función
window.inicializarSistemaLicencias = inicializarSistemaLicencias;
window.verificarLicencia = verificarLicencia;
window.obtenerInfoLicencia = obtenerInfoLicencia;
window.generarClaveLicencia = generarClaveLicencia;