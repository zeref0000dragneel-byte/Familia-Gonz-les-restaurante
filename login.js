// ============================================
// SISTEMA DE LOGIN CON CONTRASEÑA
// Versión: 1.0
// ============================================

// Configuración
const CONFIG_LOGIN = {
    intentosMaximos: 5,
    tiempoBloqueo: 15 * 60 * 1000, // 15 minutos en milisegundos
    longitudMinima: 4,
    longitudMaxima: 20
};

// Almacenamiento
const STORAGE_PASSWORD = 'app_password_hash';
const STORAGE_SALT = 'app_password_salt';
const STORAGE_INTENTOS = 'app_login_intentos';
const STORAGE_BLOQUEO = 'app_login_bloqueo';
const STORAGE_CODIGO_RECUPERACION = 'app_codigo_recuperacion';
const STORAGE_SESION_ACTIVA = 'app_sesion_activa';

// ============================================
// FUNCIONES DE ENCRIPTACIÓN
// ============================================

// Generar salt aleatorio
function generarSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash de contraseña con salt
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// GESTIÓN DE CONTRASEÑA
// ============================================

// Verificar si existe contraseña configurada
function tienePasswordConfigurada() {
    return localStorage.getItem(STORAGE_PASSWORD) !== null;
}

// Configurar contraseña por primera vez
async function configurarPassword(password) {
    // Validar longitud
    if (password.length < CONFIG_LOGIN.longitudMinima) {
        return {
            exito: false,
            mensaje: `La contraseña debe tener al menos ${CONFIG_LOGIN.longitudMinima} caracteres`
        };
    }
    
    if (password.length > CONFIG_LOGIN.longitudMaxima) {
        return {
            exito: false,
            mensaje: `La contraseña no puede tener más de ${CONFIG_LOGIN.longitudMaxima} caracteres`
        };
    }
    
    try {
        // Generar salt y hash
        const salt = generarSalt();
        const hash = await hashPassword(password, salt);
        
        // Generar código de recuperación (6 dígitos)
        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar
        localStorage.setItem(STORAGE_PASSWORD, hash);
        localStorage.setItem(STORAGE_SALT, salt);
        localStorage.setItem(STORAGE_CODIGO_RECUPERACION, codigoRecuperacion);
        
        return {
            exito: true,
            mensaje: 'Contraseña configurada correctamente',
            codigoRecuperacion: codigoRecuperacion
        };
    } catch (error) {
        console.error('Error al configurar contraseña:', error);
        return {
            exito: false,
            mensaje: 'Error al guardar la contraseña'
        };
    }
}

// Verificar contraseña
async function verificarPassword(password) {
    // Verificar si está bloqueado
    const bloqueado = verificarBloqueo();
    if (bloqueado.bloqueado) {
        return {
            correcto: false,
            mensaje: bloqueado.mensaje
        };
    }
    
    try {
        const hashGuardado = localStorage.getItem(STORAGE_PASSWORD);
        const salt = localStorage.getItem(STORAGE_SALT);
        
        if (!hashGuardado || !salt) {
            return {
                correcto: false,
                mensaje: 'No hay contraseña configurada'
            };
        }
        
        // Calcular hash de la contraseña ingresada
        const hashIngresado = await hashPassword(password, salt);
        
        if (hashIngresado === hashGuardado) {
            // Contraseña correcta - limpiar intentos
            localStorage.removeItem(STORAGE_INTENTOS);
            localStorage.removeItem(STORAGE_BLOQUEO);
            
            // Guardar sesión activa
            localStorage.setItem(STORAGE_SESION_ACTIVA, Date.now().toString());
            
            return {
                correcto: true,
                mensaje: 'Acceso concedido'
            };
        } else {
            // Contraseña incorrecta - incrementar intentos
            return registrarIntentoFallido();
        }
    } catch (error) {
        console.error('Error al verificar contraseña:', error);
        return {
            correcto: false,
            mensaje: 'Error al verificar la contraseña'
        };
    }
}

// Cambiar contraseña
async function cambiarPassword(passwordActual, passwordNueva) {
    // Verificar contraseña actual
    const verificacion = await verificarPassword(passwordActual);
    
    if (!verificacion.correcto) {
        return {
            exito: false,
            mensaje: 'La contraseña actual es incorrecta'
        };
    }
    
    // Configurar nueva contraseña
    return await configurarPassword(passwordNueva);
}

// ============================================
// GESTIÓN DE INTENTOS Y BLOQUEO
// ============================================

function registrarIntentoFallido() {
    let intentos = parseInt(localStorage.getItem(STORAGE_INTENTOS) || '0');
    intentos++;
    
    localStorage.setItem(STORAGE_INTENTOS, intentos.toString());
    
    const intentosRestantes = CONFIG_LOGIN.intentosMaximos - intentos;
    
    if (intentos >= CONFIG_LOGIN.intentosMaximos) {
        // Bloquear
        const tiempoBloqueo = Date.now() + CONFIG_LOGIN.tiempoBloqueo;
        localStorage.setItem(STORAGE_BLOQUEO, tiempoBloqueo.toString());
        
        return {
            correcto: false,
            mensaje: 'Demasiados intentos fallidos. Bloqueado por 15 minutos.',
            intentosRestantes: 0,
            bloqueado: true
        };
    } else {
        return {
            correcto: false,
            mensaje: `Contraseña incorrecta. Te quedan ${intentosRestantes} intentos.`,
            intentosRestantes: intentosRestantes,
            bloqueado: false
        };
    }
}

function verificarBloqueo() {
    const tiempoBloqueo = localStorage.getItem(STORAGE_BLOQUEO);
    
    if (!tiempoBloqueo) {
        return { bloqueado: false };
    }
    
    const tiempoActual = Date.now();
    const tiempoBloqueoNum = parseInt(tiempoBloqueo);
    
    if (tiempoActual < tiempoBloqueoNum) {
        const tiempoRestante = tiempoBloqueoNum - tiempoActual;
        const minutosRestantes = Math.ceil(tiempoRestante / (60 * 1000));
        
        return {
            bloqueado: true,
            mensaje: `Sistema bloqueado. Intenta en ${minutosRestantes} minutos.`,
            minutosRestantes: minutosRestantes
        };
    } else {
        // El bloqueo expiró
        localStorage.removeItem(STORAGE_BLOQUEO);
        localStorage.removeItem(STORAGE_INTENTOS);
        return { bloqueado: false };
    }
}

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

function recuperarPasswordConCodigo(codigoIngresado, nuevaPassword) {
    const codigoGuardado = localStorage.getItem(STORAGE_CODIGO_RECUPERACION);
    
    if (!codigoGuardado) {
        return {
            exito: false,
            mensaje: 'No hay código de recuperación disponible'
        };
    }
    
    if (codigoIngresado.toString() !== codigoGuardado) {
        return {
            exito: false,
            mensaje: 'Código de recuperación incorrecto'
        };
    }
    
    // Código correcto - configurar nueva contraseña
    return configurarPassword(nuevaPassword);
}

function obtenerCodigoRecuperacion() {
    return localStorage.getItem(STORAGE_CODIGO_RECUPERACION);
}

// ============================================
// GESTIÓN DE SESIÓN
// ============================================

function verificarSesionActiva() {
    const sesion = localStorage.getItem(STORAGE_SESION_ACTIVA);
    if (sesion) {
        return true;
    }
    return false;
}

function cerrarSesion() {
    localStorage.removeItem(STORAGE_SESION_ACTIVA);
}

// ============================================
// PANTALLA DE CONFIGURACIÓN INICIAL
// ============================================

function mostrarPantallaConfiguracionPassword() {
    const overlay = document.createElement('div');
    overlay.id = 'overlay-configurar-password';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h1 style="margin: 0 0 10px 0; color: #1f2937; text-align: center;">
                🔐 Configuración Inicial
            </h1>
            <p style="margin: 0 0 30px 0; color: #6b7280; text-align: center; font-size: 14px;">
                Crea una contraseña para proteger tu sistema
            </p>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                    ⚠️ <strong>Importante:</strong> Guarda esta contraseña en un lugar seguro. La necesitarás cada vez que abras la aplicación.
                </p>
            </div>
            
            <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                Nueva Contraseña:
            </label>
            <input type="password" id="input-nueva-password" placeholder="Mínimo 4 caracteres" 
                   style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
            
            <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                Confirmar Contraseña:
            </label>
            <input type="password" id="input-confirmar-password" placeholder="Escribe la misma contraseña" 
                   style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <input type="checkbox" id="checkbox-mostrar-password" onclick="toggleMostrarPasswordConfig()" 
                       style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                <label for="checkbox-mostrar-password" style="color: #6b7280; font-size: 13px; cursor: pointer;">
                    Mostrar contraseña
                </label>
            </div>
            
            <p id="mensaje-configurar-password" style="margin: 10px 0; color: #ef4444; font-size: 13px; min-height: 20px;"></p>
            
            <button onclick="procesarConfiguracionPassword()" 
                    style="width: 100%; padding: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                ✅ Crear Contraseña
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus en el primer input
    setTimeout(() => {
        document.getElementById('input-nueva-password').focus();
    }, 100);
}

function toggleMostrarPasswordConfig() {
    const input1 = document.getElementById('input-nueva-password');
    const input2 = document.getElementById('input-confirmar-password');
    const checkbox = document.getElementById('checkbox-mostrar-password');
    
    if (checkbox.checked) {
        input1.type = 'text';
        input2.type = 'text';
    } else {
        input1.type = 'password';
        input2.type = 'password';
    }
}

async function procesarConfiguracionPassword() {
    const password1 = document.getElementById('input-nueva-password').value;
    const password2 = document.getElementById('input-confirmar-password').value;
    const mensaje = document.getElementById('mensaje-configurar-password');
    
    if (!password1 || !password2) {
        mensaje.textContent = '⚠️ Por favor completa ambos campos.';
        mensaje.style.color = '#f59e0b';
        return;
    }
    
    if (password1 !== password2) {
        mensaje.textContent = '❌ Las contraseñas no coinciden.';
        mensaje.style.color = '#ef4444';
        return;
    }
    
    mensaje.textContent = '⏳ Configurando contraseña...';
    mensaje.style.color = '#3b82f6';
    
    const resultado = await configurarPassword(password1);
    
    if (resultado.exito) {
        // Mostrar código de recuperación
        alert(`✅ Contraseña creada correctamente!\n\n🔑 CÓDIGO DE RECUPERACIÓN:\n${resultado.codigoRecuperacion}\n\n⚠️ IMPORTANTE: Guarda este código en un lugar seguro. Lo necesitarás si olvidas tu contraseña.`);
        
        const overlay = document.getElementById('overlay-configurar-password');
        if (overlay) {
            overlay.remove();
        }
        
        // Iniciar sesión automáticamente
        localStorage.setItem(STORAGE_SESION_ACTIVA, Date.now().toString());
        
        // ⭐ NUEVO: Inicializar la app después de configurar la contraseña
        if (typeof window.continuarInicializacion === 'function') {
            console.log('✅ Iniciando aplicación después de configurar contraseña...');
            window.continuarInicializacion();
        } else if (typeof window.inicializarApp === 'function') {
            console.log('✅ Iniciando aplicación después de configurar contraseña...');
            window.inicializarApp();
            if (typeof window.configurarInstalacionPWA === 'function') {
                window.configurarInstalacionPWA();
            }
        } else {
            console.warn('⚠️ Función inicializarApp no encontrada. Recargando página...');
            location.reload();
        }
        
    } else {
        mensaje.textContent = '❌ ' + resultado.mensaje;
        mensaje.style.color = '#ef4444';
    }
}

// Hacer funciones disponibles globalmente
window.toggleMostrarPasswordConfig = toggleMostrarPasswordConfig;
window.procesarConfiguracionPassword = procesarConfiguracionPassword;

// ============================================
// PANTALLA DE LOGIN
// ============================================

function mostrarPantallaLogin() {
    // Verificar bloqueo
    const bloqueado = verificarBloqueo();
    
    const overlay = document.createElement('div');
    overlay.id = 'overlay-login';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    let mensajeBloqueo = '';
    if (bloqueado.bloqueado) {
        mensajeBloqueo = `
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
                <p style="margin: 0; color: #991b1b; font-size: 13px;">
                    🔒 ${bloqueado.mensaje}
                </p>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 50%; margin-bottom: 15px;">
                    <span style="font-size: 40px;">🔐</span>
                </div>
                <h1 style="margin: 0 0 5px 0; color: #1f2937;">Iniciar Sesión</h1>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Ingresa tu contraseña para continuar</p>
            </div>
            
            ${mensajeBloqueo}
            
            <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                Contraseña:
            </label>
            <input type="password" id="input-login-password" placeholder="Escribe tu contraseña" 
                   ${bloqueado.bloqueado ? 'disabled' : ''}
                   style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <input type="checkbox" id="checkbox-mostrar-password-login" onclick="toggleMostrarPasswordLogin()" 
                       style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                <label for="checkbox-mostrar-password-login" style="color: #6b7280; font-size: 13px; cursor: pointer;">
                    Mostrar contraseña
                </label>
            </div>
            
            <p id="mensaje-login" style="margin: 10px 0; color: #ef4444; font-size: 13px; min-height: 20px;"></p>
            
            <button onclick="procesarLogin()" ${bloqueado.bloqueado ? 'disabled' : ''}
                    style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px; ${bloqueado.bloqueado ? 'opacity: 0.5;' : ''}">
                🔓 Entrar
            </button>
            
            <button onclick="mostrarRecuperacionPassword()" 
                    style="width: 100%; padding: 12px; background: transparent; color: #667eea; border: 2px solid #667eea; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                ¿Olvidaste tu contraseña?
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus en input si no está bloqueado
    if (!bloqueado.bloqueado) {
        setTimeout(() => {
            document.getElementById('input-login-password').focus();
        }, 100);
        
        // Enter para login
        document.getElementById('input-login-password').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                procesarLogin();
            }
        });
    }
}

function toggleMostrarPasswordLogin() {
    const input = document.getElementById('input-login-password');
    const checkbox = document.getElementById('checkbox-mostrar-password-login');
    
    if (checkbox.checked) {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

async function procesarLogin() {
    const password = document.getElementById('input-login-password').value;
    const mensaje = document.getElementById('mensaje-login');
    
    if (!password) {
        mensaje.textContent = '⚠️ Por favor ingresa tu contraseña.';
        mensaje.style.color = '#f59e0b';
        return;
    }
    
    mensaje.textContent = '⏳ Verificando...';
    mensaje.style.color = '#3b82f6';
    
    const resultado = await verificarPassword(password);
    
    if (resultado.correcto) {
        mensaje.textContent = '✅ Acceso concedido';
        mensaje.style.color = '#10b981';
        
        setTimeout(() => {
            const overlay = document.getElementById('overlay-login');
            if (overlay) {
                overlay.remove();
            }
            
            // ⭐ NUEVO: Inicializar la app después del login exitoso
            if (typeof window.continuarInicializacion === 'function') {
                console.log('✅ Iniciando aplicación después del login...');
                window.continuarInicializacion();
            } else if (typeof window.inicializarApp === 'function') {
                console.log('✅ Iniciando aplicación después del login...');
                window.inicializarApp();
                if (typeof window.configurarInstalacionPWA === 'function') {
                    window.configurarInstalacionPWA();
                }
            } else {
                console.warn('⚠️ Función inicializarApp no encontrada. Recargando página...');
                location.reload();
            }
        }, 500);
    } else {
        mensaje.textContent = '❌ ' + resultado.mensaje;
        mensaje.style.color = '#ef4444';
        
        if (resultado.bloqueado) {
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
}

// Hacer funciones disponibles globalmente
window.toggleMostrarPasswordLogin = toggleMostrarPasswordLogin;
window.procesarLogin = procesarLogin;

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

function mostrarRecuperacionPassword() {
    const overlayLogin = document.getElementById('overlay-login');
    if (overlayLogin) {
        overlayLogin.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'overlay-recuperacion';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h1 style="margin: 0 0 10px 0; color: #1f2937; text-align: center;">
                🔑 Recuperar Contraseña
            </h1>
            <p style="margin: 0 0 30px 0; color: #6b7280; text-align: center; font-size: 14px;">
                Ingresa tu código de recuperación de 6 dígitos
            </p>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-size: 13px;">
                    💡 <strong>Nota:</strong> Este código se te mostró cuando creaste tu contraseña por primera vez.
                </p>
            </div>
            
            <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                Código de Recuperación:
            </label>
            <input type="text" id="input-codigo-recuperacion" placeholder="Ej: 123456" maxlength="6"
                   style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 16px; text-align: center; letter-spacing: 4px; box-sizing: border-box;">
            
            <label style="display: block; margin-bottom: 8px; color: #4b5563; font-size: 14px; font-weight: 600;">
                Nueva Contraseña:
            </label>
            <input type="password" id="input-nueva-password-recuperacion" placeholder="Mínimo 4 caracteres"
                   style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">
            
            <p id="mensaje-recuperacion" style="margin: 10px 0; color: #ef4444; font-size: 13px; min-height: 20px;"></p>
            
            <button onclick="procesarRecuperacion()" 
                    style="width: 100%; padding: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px;">
                ✅ Restablecer Contraseña
            </button>
            
            <button onclick="volverALogin()" 
                    style="width: 100%; padding: 12px; background: transparent; color: #667eea; border: 2px solid #667eea; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                ← Volver al Login
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        document.getElementById('input-codigo-recuperacion').focus();
    }, 100);
}

async function procesarRecuperacion() {
    const codigo = document.getElementById('input-codigo-recuperacion').value;
    const nuevaPassword = document.getElementById('input-nueva-password-recuperacion').value;
    const mensaje = document.getElementById('mensaje-recuperacion');
    
    if (!codigo || !nuevaPassword) {
        mensaje.textContent = '⚠️ Por favor completa todos los campos.';
        mensaje.style.color = '#f59e0b';
        return;
    }
    
    if (codigo.length !== 6) {
        mensaje.textContent = '⚠️ El código debe tener 6 dígitos.';
        mensaje.style.color = '#f59e0b';
        return;
    }
    
    mensaje.textContent = '⏳ Verificando código...';
    mensaje.style.color = '#3b82f6';
    
    const resultado = await recuperarPasswordConCodigo(codigo, nuevaPassword);
    
    if (resultado.exito) {
        alert(`✅ Contraseña restablecida correctamente!\n\n🔑 NUEVO CÓDIGO DE RECUPERACIÓN:\n${resultado.codigoRecuperacion}\n\nGuárdalo en un lugar seguro.`);
        
        const overlay = document.getElementById('overlay-recuperacion');
        if (overlay) {
            overlay.remove();
        }
        
        mostrarPantallaLogin();
    } else {
        mensaje.textContent = '❌ ' + resultado.mensaje;
        mensaje.style.color = '#ef4444';
    }
}

function volverALogin() {
    const overlay = document.getElementById('overlay-recuperacion');
    if (overlay) {
        overlay.remove();
    }
    mostrarPantallaLogin();
}

// Hacer funciones disponibles globalmente
window.mostrarRecuperacionPassword = mostrarRecuperacionPassword;
window.procesarRecuperacion = procesarRecuperacion;
window.volverALogin = volverALogin;

// ============================================
// INICIALIZACIÓN DEL SISTEMA DE LOGIN
// ============================================

function inicializarSistemaLogin() {
    console.log('🔐 Inicializando sistema de login...');
    
    // Verificar si hay contraseña configurada
    if (!tienePasswordConfigurada()) {
        console.log('⚙️ Primera vez - configurar contraseña');
        mostrarPantallaConfiguracionPassword();
        return false;
    }
    
    // Verificar si hay sesión activa
    if (verificarSesionActiva()) {
        console.log('✅ Sesión activa encontrada');
        return true; // PERMITE CONTINUAR
    }
    
    // Mostrar login
    console.log('🔒 Requiere login');
    mostrarPantallaLogin();
    return false;
}

// Exportar funciones necesarias
window.inicializarSistemaLogin = inicializarSistemaLogin;
window.cerrarSesion = cerrarSesion;
window.cambiarPassword = cambiarPassword;
window.obtenerCodigoRecuperacion = obtenerCodigoRecuperacion;