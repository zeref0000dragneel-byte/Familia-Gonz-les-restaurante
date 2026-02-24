

// ============================================
// SISTEMA DE RESTAURANTE - LÓGICA PRINCIPAL
// Versión: 3.0 - Adaptado para gestión de pedidos
// ============================================

// Variables globales para almacenar datos
let ventas = []; // Ahora son "pedidos por mesa"
let gastos = [];

// ⭐ NUEVO: Listas para autocompletado
let listaClientes = new Set();
let listaMeseros = new Set();
let listaDescripciones = new Set();

// Configuración de almacenamiento
const DB_NAME = 'RestauranteDB'; // 🔄 MODIFICADO: Nuevo nombre
const DB_VERSION = 2; // 🔄 MODIFICADO: Nueva versión
const STORE_VENTAS = 'pedidos'; // 🔄 MODIFICADO: Ahora se llaman pedidos
const STORE_GASTOS = 'gastos';

// Claves para localStorage (respaldo)
const STORAGE_VENTAS = 'restaurante_pedidos'; // 🔄 MODIFICADO
const STORAGE_GASTOS = 'restaurante_gastos';

// Estado del almacenamiento
let storageStatus = {
    indexedDB: false,
    localStorage: false,
    mode: 'unknown'
};

// ============================================
// PWA - INSTALACIÓN Y SERVICE WORKER
// ============================================

let deferredPrompt;

// Verificar si la app ya está instalada
function isAppInstalled() {
    // Verificar si está en modo standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // Verificar si está en modo fullscreen (iOS)
    if (window.navigator.standalone === true) {
        return true;
    }
    
    // Verificar si hay referencia a app instalada
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return true;
    }
    
    return false;
}

// Verificar si el banner fue descartado
function wasBannerDismissed() {
    return localStorage.getItem('install_banner_dismissed') === 'true';
}

// Mostrar banner de instalación
function mostrarBannerInstalacion() {
    const installBanner = document.getElementById('install-banner');
    
    if (!installBanner) {
        return;
    }
    
    // No mostrar si la app ya está instalada
    if (isAppInstalled()) {
        console.log('✅ App ya está instalada, banner oculto');
        installBanner.style.display = 'none';
        return;
    }
    
    // No mostrar si fue descartado
    if (wasBannerDismissed()) {
        console.log('ℹ️ Banner descartado previamente');
        installBanner.style.display = 'none';
        return;
    }
    
    // Solo mostrar si estamos en HTTP/HTTPS
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
        console.warn('⚠️ Banner no mostrado: requiere servidor HTTP');
        return;
    }
    
    // Mostrar banner después de un pequeño delay (no intrusivo)
    setTimeout(() => {
        installBanner.style.display = 'flex';
        console.log('✅ Banner de instalación mostrado');
    }, 3000); // Mostrar después de 3 segundos
}

// Función de diagnóstico para verificar requisitos de PWA
function diagnosticarPWA() {
    const diagnosticos = {
        manifest: false,
        serviceWorker: false,
        iconos: false,
        https: false,
        errores: []
    };
    
    // Verificar manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink && manifestLink.href) {
        diagnosticos.manifest = true;
        console.log('✅ Manifest encontrado:', manifestLink.href);
    } else {
        diagnosticos.errores.push('❌ No se encontró el manifest.json');
    }
    
    // Verificar service worker
    if ('serviceWorker' in navigator) {
        diagnosticos.serviceWorker = true;
        console.log('✅ Service Worker soportado');
    } else {
        diagnosticos.errores.push('❌ Service Worker no soportado en este navegador');
    }
    
    // Verificar HTTPS o localhost
    if (window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        diagnosticos.https = true;
        console.log('✅ Protocolo seguro (HTTPS/localhost)');
    } else {
        diagnosticos.errores.push('⚠️ Se recomienda HTTPS para PWA (localhost funciona)');
    }
    
    // Verificar iconos
    const iconos = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    if (iconos.length > 0) {
        diagnosticos.iconos = true;
        console.log(`✅ ${iconos.length} icono(s) encontrado(s)`);
    } else {
        diagnosticos.errores.push('⚠️ No se encontraron iconos');
    }
    
    // Mostrar resumen
    console.log('📊 Diagnóstico PWA:', diagnosticos);
    
    if (diagnosticos.errores.length > 0) {
        console.warn('⚠️ Problemas encontrados:', diagnosticos.errores);
    }
    
    return diagnosticos;
}

// Detectar evento de instalación PWA (Android/Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('✅ Evento de instalación PWA detectado');
    console.log('📱 El navegador permite instalar esta PWA');
    
    // Ejecutar diagnóstico
    diagnosticarPWA();
    
    // Mostrar banner si cumple condiciones
    mostrarBannerInstalacion();
});

// Detectar cuando la app se instala
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada correctamente');
    deferredPrompt = null;
    
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
        installBanner.style.display = 'none';
    }
    
    // Limpiar flag de descartado para futuras instalaciones
    localStorage.removeItem('install_banner_dismissed');
});

// Limpiar service workers y caches antiguos
async function limpiarServiceWorkersAntiguos() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    
    try {
        // Obtener todos los registros de service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        console.log(`🔍 Encontrados ${registrations.length} service worker(s) registrado(s)`);
        
        // Desregistrar TODOS los service workers y volver a registrar el correcto
        // Esto asegura que no haya conflictos con proyectos anteriores
        for (let registration of registrations) {
            const swUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || '';
            console.log('🗑️ Desregistrando service worker:', swUrl);
            
            // Desregistrar todos y luego registraremos el correcto
            try {
                const unregistered = await registration.unregister();
                if (unregistered) {
                    console.log('✅ Service worker desregistrado:', swUrl);
                }
            } catch (error) {
                console.warn('⚠️ Error al desregistrar service worker:', error);
            }
        }
        
        // Esperar un momento para que se complete la desregistración
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Limpiar caches que no sean del proyecto actual
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`🔍 Encontrados ${cacheNames.length} cache(s)`);
            
            const currentCaches = cacheNames.filter(name => 
                name.includes('familia-gonzales')
            );
            
            // Eliminar caches que no sean del proyecto actual
            const oldCaches = cacheNames.filter(name => 
                !name.includes('familia-gonzales')
            );
            
            for (let cacheName of oldCaches) {
                console.log('🗑️ Eliminando cache antiguo:', cacheName);
                await caches.delete(cacheName);
            }
            
            console.log(`✅ Caches actuales del proyecto: ${currentCaches.length}`);
        }
    } catch (error) {
        console.warn('⚠️ Error al limpiar service workers antiguos:', error);
    }
}

// Registrar Service Worker para funcionalidad offline
async function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker no soportado en este navegador');
        return;
    }
    
    // Verificar que estemos en HTTP/HTTPS
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
        console.warn('⚠️ Service Worker requiere servidor HTTP. Abre con servidor local.');
        mostrarAdvertenciaServidor();
        return;
    }
    
    try {
        // Primero limpiar service workers antiguos
        await limpiarServiceWorkersAntiguos();
        
        // Registrar el nuevo service worker
        const registration = await navigator.serviceWorker.register('./service-worker.js', {
            scope: './'
        });
        
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar actualizaciones periódicamente
        setInterval(() => {
            registration.update();
        }, 60000); // Cada minuto
        
        // Escuchar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nuevo service worker encontrado, instalando...');
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 Nuevo service worker instalado. Recarga la página para activarlo.');
                }
            });
        });
        
        // Escuchar mensajes del service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_ACTIVATED') {
                console.log('✅ Service Worker activado - Versión:', event.data.version);
            }
        });
        
    } catch (error) {
        console.error('❌ Error al registrar Service Worker:', error);
        mostrarAdvertenciaServidor();
    }
}

// Registrar Service Worker cuando la página cargue
window.addEventListener('load', () => {
    registrarServiceWorker();
});

if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App ejecutándose en modo standalone (instalada)');
}

function mostrarAdvertenciaServidor() {
    if (localStorage.getItem('servidor_advertencia_vista')) return;
    
    setTimeout(() => {
        const mensaje = document.createElement('div');
        mensaje.id = 'advertencia-servidor';
        mensaje.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
        mensaje.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">⚠️ Servidor Requerido</h3>
            <p style="margin: 0 0 15px 0; font-size: 14px;">
                Para instalar la PWA, necesitas usar un servidor local.<br>
                Usa: <strong>python -m http.server 8000</strong>
            </p>
            <button onclick="this.parentElement.remove(); localStorage.setItem('servidor_advertencia_vista', 'true');" 
                    style="background: white; color: #ff6b6b; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Entendido
            </button>
        `;
        document.body.appendChild(mensaje);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }, 1000);
}

// ============================================
// INICIALIZACIÓN
// ============================================

// ============================================
// INTEGRACIÓN CON SISTEMA DE LICENCIAS Y LOGIN
// ============================================

// Función para continuar inicialización después del login/licencias
window.continuarInicializacion = async function() {
    console.log('✅ Continuando inicialización de la aplicación...');
    
    await inicializarAlmacenamiento();
    await cargarDatos();
    
    configurarNavegacion();
    configurarFormularios();
    configurarBorrarTodo();
    
    actualizarDashboard();
    mostrarPedidos();
    mostrarGastos();
    
    // Si Chart.js cargó con defer, la gráfica puede no estar aún; volver a intentar en 0.5s
    setTimeout(function() { actualizarGrafica(); }, 500);
    
    const hoy = obtenerFechaLocal();
    const pedidoFecha = document.getElementById('pedido-fecha');
    const gastoFecha = document.getElementById('gasto-fecha');
    if (pedidoFecha) pedidoFecha.value = hoy;
    if (gastoFecha) gastoFecha.value = hoy;
    
    actualizarIndicadorEstado();
    verificarRecordatorioRespaldo();
    actualizarDatalistsAutocompletado();
    
    // Agregar primera fila de artículo a la tabla (la fila de datos de mesa ya está en el HTML)
    setTimeout(() => {
        const tbody = document.getElementById('tbody-articulos');
        if (tbody) {
            // Contar solo filas de artículos (excluyendo la fila de datos de mesa)
            const filasArticulos = Array.from(tbody.children).filter(tr => tr.id !== 'fila-datos-mesa');
            if (filasArticulos.length === 0 && articulosTemporales.length === 0) {
                agregarArticulo();
            }
        }
    }, 100);
    
    console.log('✅ Aplicación inicializada correctamente');
};

// ============================================
// INICIALIZACIÓN PRINCIPAL CON PROTECCIÓN ______________________
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 DOM cargado, iniciando verificaciones...');
    
    // Verificar que las funciones de licencia y login estén disponibles
    if (typeof window.inicializarSistemaLicencias !== 'function') {
        console.error('❌ Error: inicializarSistemaLicencias no está disponible');
        console.error('💡 Verifica que licencias.js se cargue antes de app.js');
        return;
    }
    
    if (typeof window.inicializarSistemaLogin !== 'function') {
        console.error('❌ Error: inicializarSistemaLogin no está disponible');
        console.error('💡 Verifica que login.js se cargue antes de app.js');
        return;
    }
    
    // ⭐ PASO 1: PRIMERO verificar licencia (OBLIGATORIO)
    const licenciaValida = window.inicializarSistemaLicencias();
    if (!licenciaValida) {
        console.warn('⚠️ Esperando activación de licencia...');
        // NO continuar hasta que se active la licencia
        // La pantalla de activación se quedará visible
        return;
    }
    
    // ⭐ PASO 2: DESPUÉS verificar login (solo si la licencia es válida)
    const loginCorrecto = window.inicializarSistemaLogin();
    if (!loginCorrecto) {
        console.warn('⚠️ Esperando login...');
        // NO continuar hasta que se inicie sesión
        // procesarLogin() o procesarConfiguracionPassword() llamarán a continuarInicializacion()
        return;
    }
    
    // ⭐ PASO 3: Si llegó aquí, licencia válida Y login correcto
    continuarInicializacion();
});
console.log('✅ Sistema de Restaurante v3.0 cargado correctamente');


// ============================================
// GESTIÓN DE ALMACENAMIENTO (IndexedDB + localStorage)
// ============================================

async function inicializarAlmacenamiento() {
    if (window.indexedDB) {
        try {
            const db = await abrirIndexedDB();
            if (db) {
                storageStatus.indexedDB = true;
                storageStatus.mode = 'indexeddb';
                console.log('✅ IndexedDB disponible y funcionando');
            }
        } catch (error) {
            console.warn('⚠️ Error al inicializar IndexedDB:', error);
        }
    }
    
    try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        storageStatus.localStorage = true;
        if (storageStatus.mode === 'unknown') {
            storageStatus.mode = 'localstorage';
        }
        console.log('✅ localStorage disponible y funcionando');
    } catch (error) {
        console.error('❌ localStorage no disponible:', error);
    }
}

// 🔄 MODIFICADO: Estructura actualizada para pedidos
function abrirIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Error al abrir IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // ⭐ NUEVO: Store de pedidos con índices
            if (!db.objectStoreNames.contains(STORE_VENTAS)) {
                const pedidosStore = db.createObjectStore(STORE_VENTAS, { keyPath: 'id', autoIncrement: false });
                pedidosStore.createIndex('fecha', 'fecha', { unique: false });
                pedidosStore.createIndex('mesa', 'mesa', { unique: false });
                pedidosStore.createIndex('cliente', 'cliente', { unique: false });
                pedidosStore.createIndex('mesero', 'mesero', { unique: false });
                pedidosStore.createIndex('estaPagado', 'estaPagado', { unique: false });
                console.log('✅ Store de pedidos creado con índices');
            }
            
            if (!db.objectStoreNames.contains(STORE_GASTOS)) {
                db.createObjectStore(STORE_GASTOS, { keyPath: 'id', autoIncrement: false });
            }
        };
    });
}

function obtenerObjectStore(db, storeName, mode) {
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
}

async function cargarDatos() {
    try {
        if (storageStatus.indexedDB) {
            await cargarDesdeIndexedDB();
        } else if (storageStatus.localStorage) {
            cargarDesdeLocalStorage();
        } else {
            console.error('❌ No hay almacenamiento disponible');
            ventas = [];
            gastos = [];
        }
        
        // ⭐ NUEVO: Actualizar listas de autocompletado después de cargar
        actualizarListasAutocompletado();
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        if (storageStatus.localStorage) {
            cargarDesdeLocalStorage();
        }
    }
}

async function cargarDesdeIndexedDB() {
    const db = await abrirIndexedDB();
    
    const ventasStore = obtenerObjectStore(db, STORE_VENTAS, 'readonly');
    const ventasRequest = ventasStore.getAll();
    ventas = await new Promise((resolve) => {
        ventasRequest.onsuccess = () => resolve(ventasRequest.result || []);
        ventasRequest.onerror = () => resolve([]);
    });
    
    const gastosStore = obtenerObjectStore(db, STORE_GASTOS, 'readonly');
    const gastosRequest = gastosStore.getAll();
    gastos = await new Promise((resolve) => {
        gastosRequest.onsuccess = () => resolve(gastosRequest.result || []);
        gastosRequest.onerror = () => resolve([]);
    });
    
    console.log(`✅ Datos cargados desde IndexedDB: ${ventas.length} pedidos, ${gastos.length} gastos`);
}

function cargarDesdeLocalStorage() {
    const ventasGuardadas = localStorage.getItem(STORAGE_VENTAS);
    const gastosGuardados = localStorage.getItem(STORAGE_GASTOS);
    
    try {
        ventas = ventasGuardadas ? JSON.parse(ventasGuardadas) : [];
        if (!Array.isArray(ventas)) ventas = [];
    } catch (e) {
        console.warn('⚠️ Error al leer pedidos de localStorage, usando lista vacía:', e);
        ventas = [];
    }
    
    try {
        gastos = gastosGuardados ? JSON.parse(gastosGuardados) : [];
        if (!Array.isArray(gastos)) gastos = [];
    } catch (e) {
        console.warn('⚠️ Error al leer gastos de localStorage, usando lista vacía:', e);
        gastos = [];
    }
    
    console.log(`✅ Datos cargados desde localStorage: ${ventas.length} pedidos, ${gastos.length} gastos`);
}

async function guardarVentas() {
    try {
        if (storageStatus.indexedDB) {
            await guardarVentasIndexedDB();
        }
        if (storageStatus.localStorage) {
            guardarVentasLocalStorage();
        }
        actualizarIndicadorEstado();
        
        // ⭐ NUEVO: Actualizar autocompletado después de guardar
        actualizarListasAutocompletado();
        actualizarDatalistsAutocompletado();
        
    } catch (error) {
        console.error('Error al guardar pedidos:', error);
        if (storageStatus.localStorage) {
            guardarVentasLocalStorage();
        }
        actualizarIndicadorEstado();
    }
}

async function guardarGastos() {
    try {
        if (storageStatus.indexedDB) {
            await guardarGastosIndexedDB();
        }
        if (storageStatus.localStorage) {
            guardarGastosLocalStorage();
        }
        actualizarIndicadorEstado();
    } catch (error) {
        console.error('Error al guardar gastos:', error);
        if (storageStatus.localStorage) {
            guardarGastosLocalStorage();
        }
        actualizarIndicadorEstado();
    }
}

async function guardarVentasIndexedDB() {
    const db = await abrirIndexedDB();
    const store = obtenerObjectStore(db, STORE_VENTAS, 'readwrite');
    
    await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    for (const venta of ventas) {
        await new Promise((resolve, reject) => {
            const addRequest = store.add(venta);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        });
    }
}

async function guardarGastosIndexedDB() {
    const db = await abrirIndexedDB();
    const store = obtenerObjectStore(db, STORE_GASTOS, 'readwrite');
    
    await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    for (const gasto of gastos) {
        await new Promise((resolve, reject) => {
            const addRequest = store.add(gasto);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        });
    }
}

function guardarVentasLocalStorage() {
    localStorage.setItem(STORAGE_VENTAS, JSON.stringify(ventas));
}

function guardarGastosLocalStorage() {
    localStorage.setItem(STORAGE_GASTOS, JSON.stringify(gastos));
}

// ⭐ NUEVO: Sistema de autocompletado
function actualizarListasAutocompletado() {
    listaClientes.clear();
    listaMeseros.clear();
    listaDescripciones.clear();
    
    if (!Array.isArray(ventas)) return;
    
    ventas.forEach(pedido => {
        if (pedido.cliente) listaClientes.add(pedido.cliente);
        if (pedido.mesero) listaMeseros.add(pedido.mesero);
        
        if (pedido.articulos && Array.isArray(pedido.articulos)) {
            pedido.articulos.forEach(art => {
                if (art.descripcion) listaDescripciones.add(art.descripcion);
            });
        }
    });
    
    console.log(`✅ Autocompletado actualizado: ${listaClientes.size} clientes, ${listaMeseros.size} meseros, ${listaDescripciones.size} platillos`);
}

function actualizarDatalistsAutocompletado() {
    // Actualizar datalist de clientes
    const datalistClientes = document.getElementById('lista-clientes');
    if (datalistClientes) {
        datalistClientes.innerHTML = Array.from(listaClientes)
            .map(cliente => `<option value="${cliente}">`)
            .join('');
    }
    
    // Actualizar datalist de meseros
    const datalistMeseros = document.getElementById('lista-meseros');
    if (datalistMeseros) {
        datalistMeseros.innerHTML = Array.from(listaMeseros)
            .map(mesero => `<option value="${mesero}">`)
            .join('');
    }
    
    // Actualizar datalist de descripciones
    const datalistDescripciones = document.getElementById('lista-descripciones');
    if (datalistDescripciones) {
        datalistDescripciones.innerHTML = Array.from(listaDescripciones)
            .map(desc => `<option value="${desc}">`)
            .join('');
    }
}

// ============================================
// NAVEGACIÓN ENTRE TABS
// ============================================

function configurarNavegacion() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// ============================================
// CONFIGURACIÓN DE FORMULARIOS
// ============================================

function configurarFormularios() {
    // ⭐ NUEVO: Formulario de pedidos (antes era ventas)
    const formPedido = document.getElementById('form-pedido');
    if (formPedido) {
        formPedido.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarPedido();
        });
    }
    
    // Formulario de gastos (sin cambios)
    const formGasto = document.getElementById('form-gasto');
    if (formGasto) {
        formGasto.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarGasto();
        });
    }
    
    // Filtro de categorías en gastos
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', function(e) {
            const categoriaSeleccionada = e.target.value;
            mostrarGastos(categoriaSeleccionada);
        });
    }
}

function configurarBorrarTodo() {
    const btnBorrarTodo = document.getElementById('btn-borrar-todo');
    if (btnBorrarTodo) {
        btnBorrarTodo.addEventListener('click', borrarTodosLosDatos);
    }
}

function actualizarIndicadorEstado() {
    const indicador = document.getElementById('storage-status');
    if (!indicador) return;
    
    if (storageStatus.indexedDB) {
        indicador.className = 'storage-status success';
        indicador.innerHTML = '✅ Datos guardados correctamente';
        indicador.title = 'IndexedDB funcionando correctamente';
    } else if (storageStatus.localStorage) {
        indicador.className = 'storage-status warning';
        indicador.innerHTML = '⚠️ Usando respaldo (localStorage)';
        indicador.title = 'No se pudo usar IndexedDB, usando localStorage';
    } else {
        indicador.className = 'storage-status error';
        indicador.innerHTML = '❌ Error: No se pueden guardar datos';
        indicador.title = 'El almacenamiento está bloqueado. Haz respaldos frecuentes.';
    }
}

async function borrarTodosLosDatos() {
    const confirm1 = confirm('⚠️ ADVERTENCIA: Estás a punto de borrar TODOS los datos.\n\nEsto incluye TODOS los pedidos y gastos registrados.\n\n¿Estás seguro que quieres continuar?');
    
    if (!confirm1) return;
    
    const confirm2 = confirm('🚨 ÚLTIMA OPORTUNIDAD 🚨\n\nEsta acción NO SE PUEDE DESHACER.\n\nEscribe "CONFIRMAR" en la siguiente ventana si realmente quieres borrar TODO.');
    
    if (!confirm2) return;
    
    const confirm3 = prompt('Para confirmar, escribe exactamente: CONFIRMAR');
    
    if (confirm3 !== 'CONFIRMAR') {
        mostrarMensaje('Operación cancelada. Los datos están seguros.', 'info');
        return;
    }
    
    try {
        ventas = [];
        gastos = [];
        
        if (storageStatus.indexedDB) {
            try {
                const db = await abrirIndexedDB();
                
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction([STORE_VENTAS], 'readwrite');
                    const ventasStore = transaction.objectStore(STORE_VENTAS);
                    const clearVentas = ventasStore.clear();
                    clearVentas.onsuccess = () => {
                        transaction.oncomplete = () => {
                            console.log('✅ Pedidos borrados de IndexedDB');
                            resolve();
                        };
                        transaction.onerror = () => reject(transaction.error);
                    };
                    clearVentas.onerror = () => reject(clearVentas.error);
                });
                
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction([STORE_GASTOS], 'readwrite');
                    const gastosStore = transaction.objectStore(STORE_GASTOS);
                    const clearGastos = gastosStore.clear();
                    clearGastos.onsuccess = () => {
                        transaction.oncomplete = () => {
                            console.log('✅ Gastos borrados de IndexedDB');
                            resolve();
                        };
                        transaction.onerror = () => reject(transaction.error);
                    };
                    clearGastos.onerror = () => reject(clearGastos.error);
                });
                
                console.log('✅ Todos los datos borrados de IndexedDB correctamente');
            } catch (error) {
                console.error('Error al borrar de IndexedDB:', error);
            }
        }
        
        if (storageStatus.localStorage) {
            try {
                localStorage.removeItem(STORAGE_VENTAS);
                localStorage.removeItem(STORAGE_GASTOS);
                console.log('✅ Datos borrados de localStorage correctamente');
            } catch (error) {
                console.error('Error al borrar de localStorage:', error);
            }
        }
        
        ventas = [];
        gastos = [];
        
        // Limpiar autocompletado
        listaClientes.clear();
        listaMeseros.clear();
        listaDescripciones.clear();
        actualizarDatalistsAutocompletado();
        
        if (ventas.length > 0 || gastos.length > 0) {
            console.warn('⚠️ Algunos datos aún existen después del borrado. Forzando borrado...');
            ventas = [];
            gastos = [];
            await guardarVentas();
            await guardarGastos();
        }
        
        actualizarDashboard();
        mostrarPedidos();
        mostrarGastos();
        
        mostrarMensaje('✅ Todos los datos han sido borrados exitosamente. Puedes empezar un nuevo período.', 'success');
        
    } catch (error) {
        console.error('Error al borrar datos:', error);
        mostrarMensaje('❌ Error al borrar los datos. Intenta de nuevo.', 'error');
    }
}

// ============================================
// ⭐ NUEVO: GESTIÓN DE PEDIDOS POR MESA
// ============================================

let articulosTemporales = []; // Array temporal para artículos antes de guardar
let contadorArticulos = 0; // Contador para IDs únicos

function agregarArticulo() {
    const tbody = document.getElementById('tbody-articulos');
    if (!tbody) return;
    
    // Usar contador + timestamp para garantizar ID único
    contadorArticulos++;
    const articuloId = Date.now() + contadorArticulos;
    
    const fila = document.createElement('tr');
    fila.id = `fila-${articuloId}`;
    fila.innerHTML = `
        <td>
            <input type="text" 
                   class="articulo-descripcion" 
                   list="lista-descripciones" 
                   placeholder="Descripción del platillo" 
                   required>
        </td>
        <td>
            <input type="number" 
                   class="articulo-precio" 
                   min="0.01" 
                   step="0.01" 
                   placeholder="0.00" 
                   onchange="calcularSubtotalFila(${articuloId})" 
                   required>
        </td>
        <td>
            <input type="number" 
                   class="articulo-cantidad" 
                   min="1" 
                   value="1" 
                   onchange="calcularSubtotalFila(${articuloId})" 
                   required>
        </td>
        <td>
            <span class="articulo-subtotal" id="subtotal-${articuloId}">$0.00</span>
        </td>
        <td>
            <button type="button" 
                    onclick="eliminarFila(${articuloId})" 
                    class="btn-eliminar-fila">❌</button>
        </td>
    `;
    
    tbody.appendChild(fila);
    articulosTemporales.push(articuloId);
}

function eliminarFila(articuloId) {
    const tbody = document.getElementById('tbody-articulos');
    if (!tbody) return;
    
    // No permitir eliminar la fila de datos de la mesa
    if (articuloId === 'datos-mesa') return;
    
    const fila = document.getElementById(`fila-${articuloId}`);
    if (!fila) return;
    
    // Contar solo filas de artículos (excluyendo la fila de datos de mesa)
    const filasArticulos = Array.from(tbody.children).filter(tr => tr.id !== 'fila-datos-mesa');
    
    if (filasArticulos.length > 1) {
        fila.remove();
        articulosTemporales = articulosTemporales.filter(id => id !== articuloId);
        calcularTotalPedido();
    } else {
        mostrarMensaje('Debe haber al menos una fila de artículo en la tabla', 'warning');
    }
}

// Mantener compatibilidad con nombre anterior
window.eliminarArticuloTemp = eliminarFila;

function calcularSubtotalFila(articuloId) {
    const fila = document.getElementById(`fila-${articuloId}`);
    if (!fila) return;
    
    const cantidad = parseFloat(fila.querySelector('.articulo-cantidad').value) || 0;
    const precio = parseFloat(fila.querySelector('.articulo-precio').value) || 0;
    const subtotal = cantidad * precio;
    
    const subtotalSpan = document.getElementById(`subtotal-${articuloId}`);
    if (subtotalSpan) {
        subtotalSpan.textContent = formatearMoneda(subtotal);
    }
    
    calcularTotalPedido();
}

// Mantener compatibilidad con nombre anterior
window.calcularSubtotalArticulo = calcularSubtotalFila;

function calcularTotalPedido() {
    let totalArticulos = 0;
    
    articulosTemporales.forEach(articuloId => {
        const fila = document.getElementById(`fila-${articuloId}`);
        if (fila) {
            const cantidad = parseFloat(fila.querySelector('.articulo-cantidad').value) || 0;
            const precio = parseFloat(fila.querySelector('.articulo-precio').value) || 0;
            totalArticulos += cantidad * precio;
        }
    });
    
    const totalSpan = document.getElementById('pedido-total');
    if (totalSpan) {
        totalSpan.textContent = formatearMoneda(totalArticulos);
    }
}

let guardandoPedido = false;
async function guardarPedido() {
    if (guardandoPedido) return;
    
    // Validar datos de la mesa
    const fecha = document.getElementById('pedido-fecha').value;
    const mesa = document.getElementById('pedido-mesa').value.trim();
    const cliente = document.getElementById('pedido-cliente').value.trim();
    const mesero = document.getElementById('pedido-mesero').value.trim();
    
    if (!fecha || !mesa || !cliente || !mesero) {
        mostrarMensaje('Por favor completa los datos de la mesa (Fecha, Mesa, Cliente, Mesero)', 'error');
        return;
    }
    
    // Validar que haya al menos un artículo
    if (articulosTemporales.length === 0) {
        mostrarMensaje('Debes agregar al menos un artículo/platillo al pedido', 'error');
        return;
    }
    
    // Recopilar artículos
    const articulos = [];
    let todosValidos = true;
    
    articulosTemporales.forEach(articuloId => {
        const fila = document.getElementById(`fila-${articuloId}`);
        if (fila) {
            const descripcion = fila.querySelector('.articulo-descripcion').value.trim();
            const cantidad = parseFloat(fila.querySelector('.articulo-cantidad').value);
            const precio = parseFloat(fila.querySelector('.articulo-precio').value);
            
            if (!descripcion || cantidad <= 0 || precio <= 0) {
                todosValidos = false;
                return;
            }
            
            articulos.push({
                id: articuloId,
                descripcion: descripcion,
                cantidad: cantidad,
                precio: precio,
                subtotal: cantidad * precio
            });
        }
    });
    
    if (!todosValidos || articulos.length === 0) {
        mostrarMensaje('Por favor completa todos los artículos correctamente (descripción, cantidad > 0, precio > 0)', 'error');
        return;
    }
    
    // Calcular totales
    const totalFinal = articulos.reduce((sum, art) => sum + art.subtotal, 0);
    
    // Crear objeto de pedido
    const nuevoPedido = {
        id: Date.now(),
        fecha: fecha,
        mesa: mesa,
        cliente: cliente,
        mesero: mesero,
        articulos: articulos,
        totalFinal: totalFinal
    };
    
    // Agregar a la lista
    ventas.push(nuevoPedido);
    
    guardandoPedido = true;
    const formPedido = document.getElementById('form-pedido');
    const btnPedido = formPedido ? formPedido.querySelector('button[type="submit"]') : null;
    if (btnPedido) { btnPedido.disabled = true; btnPedido.textContent = '⏳ Guardando...'; }
    
    try {
        await guardarVentas();
    } finally {
        guardandoPedido = false;
        if (btnPedido) { btnPedido.disabled = false; btnPedido.textContent = '💾 GUARDAR PEDIDO'; }
    }
    
    // Limpiar formulario
    if (formPedido) formPedido.reset();
    const tbody = document.getElementById('tbody-articulos');
    if (tbody) {
        const filasArticulos = Array.from(tbody.children).filter(tr => tr.id !== 'fila-datos-mesa');
        filasArticulos.forEach(fila => fila.remove());
    }
    articulosTemporales = [];
    const pedidoFechaEl = document.getElementById('pedido-fecha');
    if (pedidoFechaEl) pedidoFechaEl.value = obtenerFechaLocal();
    const totalSpan = document.getElementById('pedido-total');
    if (totalSpan) {
        totalSpan.textContent = '$0.00';
    }
    
    // Agregar una fila vacía de artículo
    agregarArticulo();
    
    // Actualizar vistas
    actualizarDashboard();
    mostrarPedidos();
    
    mostrarMensaje(`✅ Pedido guardado: Mesa ${mesa} - ${cliente} - Total: ${formatearMoneda(totalFinal)}`, 'success');
}

// ============================================
// MOSTRAR PEDIDOS
// ============================================

function mostrarPedidos() {
    const container = document.getElementById('ventas-list');
    if (!container) return;
    
    if (ventas.length === 0) {
        container.innerHTML = '<div class="empty-state">📋 No hay pedidos registrados</div>';
        return;
    }
    
    // Ordenar por fecha descendente
    const pedidosOrdenados = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    container.innerHTML = pedidosOrdenados.map(pedido => {
        // Compatibilidad con datos antiguos
        const precioUnitario = (art) => art.precioUnitario || art.precio || 0;
        
        return `
        <div class="pedido-ticket">
            <div class="ticket-header">
                <strong>MESA:</strong> ${pedido.mesa} &nbsp;&nbsp; 
                <strong>FECHA:</strong> ${formatearFecha(pedido.fecha)}
            </div>
            <div class="ticket-info">
                <strong>MESERO:</strong> ${pedido.mesero}<br>
                <strong>CLIENTE:</strong> ${pedido.cliente}
            </div>
            
            <table class="ticket-tabla">
                <thead>
                    <tr>
                        <th>DESCRIPCION</th>
                        <th>PRECIO</th>
                        <th>CANT</th>
                        <th>SUB_TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedido.articulos.map(art => `
                        <tr>
                            <td>${art.descripcion}</td>
                            <td>${formatearMoneda(precioUnitario(art))}</td>
                            <td>${art.cantidad}</td>
                            <td>${formatearMoneda(art.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="ticket-total">
                <strong>TOTAL: ${formatearMoneda(pedido.totalFinal)}</strong>
            </div>
            
            <div class="ticket-acciones">
                <button onclick="editarPedido(${pedido.id})" class="btn-editar">✏️ Editar</button>
                <button onclick="eliminarPedido(${pedido.id})" class="btn-eliminar">🗑️ Eliminar</button>
                <button onclick="imprimirTicket(${pedido.id})" class="btn-imprimir">🖨️ Imprimir Ticket</button>
            </div>
        </div>
        `;
    }).join('');
}

// ============================================
// EDITAR PEDIDO
// ============================================

function editarPedido(id) {
    const pedido = ventas.find(v => v.id === id);
    if (!pedido) return;
    
    // Llenar formulario con datos del pedido
    document.getElementById('pedido-fecha').value = pedido.fecha;
    document.getElementById('pedido-mesa').value = pedido.mesa;
    document.getElementById('pedido-cliente').value = pedido.cliente;
    document.getElementById('pedido-mesero').value = pedido.mesero;
    
    // Limpiar solo las filas de artículos, mantener la fila de datos de mesa
    const tbody = document.getElementById('tbody-articulos');
    if (tbody) {
        const filasArticulos = Array.from(tbody.children).filter(tr => tr.id !== 'fila-datos-mesa');
        filasArticulos.forEach(fila => fila.remove());
    }
    articulosTemporales = [];
    
    // Cargar artículos existentes
    pedido.articulos.forEach(art => {
        contadorArticulos++;
        const articuloId = Date.now() + contadorArticulos;
        articulosTemporales.push(articuloId);
        
        const tbody = document.getElementById('tbody-articulos');
        if (tbody) {
            const fila = document.createElement('tr');
            fila.id = `fila-${articuloId}`;
            const precio = art.precioUnitario || art.precio || 0;
            fila.innerHTML = `
                <td>
                    <input type="text" 
                           class="articulo-descripcion" 
                           list="lista-descripciones" 
                           value="${art.descripcion}"
                           placeholder="Descripción del platillo" 
                           required>
                </td>
                <td>
                    <input type="number" 
                           class="articulo-precio" 
                           min="0.01" 
                           step="0.01" 
                           value="${precio}"
                           placeholder="0.00" 
                           onchange="calcularSubtotalFila(${articuloId})" 
                           required>
                </td>
                <td>
                    <input type="number" 
                           class="articulo-cantidad" 
                           min="1" 
                           value="${art.cantidad}" 
                           onchange="calcularSubtotalFila(${articuloId})" 
                           required>
                </td>
                <td>
                    <span class="articulo-subtotal" id="subtotal-${articuloId}">${formatearMoneda(art.subtotal)}</span>
                </td>
                <td>
                    <button type="button" 
                            onclick="eliminarFila(${articuloId})" 
                            class="btn-eliminar-fila">❌</button>
                </td>
            `;
            tbody.appendChild(fila);
        }
    });
    
    calcularTotalPedido();
    
    // Eliminar pedido original
    ventas = ventas.filter(v => v.id !== id);
    guardarVentas();
    
    // Cambiar a tab de pedidos y hacer scroll al formulario
    const tabBtn = document.querySelector('[data-tab="ventas"]');
    if (tabBtn) tabBtn.click();
    setTimeout(() => {
        const form = document.getElementById('form-pedido');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    mostrarMensaje('📝 Pedido cargado para edición. Modifica y guarda los cambios.', 'info');
}

// ============================================
// ELIMINAR PEDIDO
// ============================================

async function eliminarPedido(id) {
    const pedido = ventas.find(v => v.id === id);
    if (!pedido) return;
    
    const confirmar = confirm(`¿Eliminar pedido de Mesa ${pedido.mesa} - ${pedido.cliente}?\nTotal: ${formatearMoneda(pedido.totalFinal)}`);
    if (!confirmar) return;
    
    ventas = ventas.filter(v => v.id !== id);
    await guardarVentas();
    
    actualizarDashboard();
    mostrarPedidos();
    
    mostrarMensaje('🗑️ Pedido eliminado correctamente', 'success');
}

// ============================================
// IMPRIMIR TICKET INDIVIDUAL
// ============================================

function imprimirTicket(id) {
    const pedido = ventas.find(v => v.id === id);
    if (!pedido) return;

    const precioUnitario = (art) => art.precioUnitario || art.precio || 0;

    const mon = (val) => '$' + Number(val || 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const fecha = new Date(pedido.fecha + 'T00:00:00');
    const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const filas = (pedido.articulos || []).map(art => `
        <div style="border-bottom:1px dashed #aaa; padding:4px 0; font-family:Arial,sans-serif; font-size:10pt;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1; min-width:0; padding:0 2px; word-break:break-word;">
                    ${(art.descripcion || '').toString()} (x${art.cantidad})
                </div>
                <div style="width:78px; flex-shrink:0; text-align:right; padding:0 2px; white-space:nowrap; font-weight:bold;">
                    ${mon(art.subtotal)}
                </div>
            </div>
            <div style="font-size:9pt; color:#000; padding:0 2px;">
                ${mon(precioUnitario(art))} c/u
            </div>
        </div>`).join('');

    const htmlFinal = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket - Comedor González</title>
    <style>
        @media print {
            @page { size: 58mm auto; margin: 2mm 1mm; }
            body  { margin: 0; padding: 0; }
            .no-print { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            width: 220px;
            max-width: 220px;
            margin: 0 auto;
            padding: 4px 0;
            background: #fff;
            color: #000;
            -webkit-font-smoothing: none;
            font-smooth: never;
        }
        .encabezado  { text-align: center; margin-bottom: 4px; }
        .nombre      { font-family: 'Arial Black', Arial, sans-serif;
                       font-size: 13pt; font-weight: 900; letter-spacing: 0.3px; }
        .fecha-txt   { font-size: 9pt; margin-top: 1px; }
        .linea-doble { border-top: 2.5px solid #000; margin: 4px 0; }
        .linea-dash  { border-top: 1px dashed #555; margin: 3px 0; }
        .info        { margin: 4px 0; font-size: 10pt; }
        .info-fila   { display: flex; margin-bottom: 2px; }
        .info-label  { font-weight: bold; min-width: 68px; flex-shrink: 0; }
        .col-header  {
            display: flex;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            padding: 3px 0;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .total-bloque {
            text-align: right;
            font-family: 'Arial Black', Arial, sans-serif;
            font-size: 13pt;
            font-weight: 900;
            padding: 2px 2px;
        }
        .footer    { text-align: center; font-size: 9pt; margin-top: 4px; }
        .no-print  { text-align: center; margin-top: 10px; }
        .no-print button {
            font-family: inherit; font-size: 10pt; padding: 5px 16px;
            cursor: pointer; border: 1px solid #333;
            background: #f5f5f5; border-radius: 4px;
        }
    </style>
</head>
<body>

    <div class="encabezado">
        <div class="nombre">Comedor González</div>
        <div class="fecha-txt">${fechaFormateada}</div>
    </div>

    <div class="linea-doble"></div>

    <div class="info">
        <div class="info-fila">
            <span class="info-label">MESA:</span>
            <span>${(pedido.mesa    || '').toString().substring(0, 28)}</span>
        </div>
        <div class="info-fila">
            <span class="info-label">MESERO:</span>
            <span>${(pedido.mesero  || '').toString().substring(0, 28)}</span>
        </div>
        <div class="info-fila">
            <span class="info-label">CLIENTE:</span>
            <span>${(pedido.cliente || '').toString().substring(0, 28)}</span>
        </div>
    </div>

    <div class="linea-dash"></div>

    <div class="col-header">
        <div style="flex:1; min-width:0; padding:0 2px; text-align:left;">Artículo</div>
        <div style="width:78px; flex-shrink:0; padding:0 2px; text-align:right;">Importe</div>
    </div>

    ${filas}

    <div class="linea-doble"></div>
    <div class="total-bloque">TOTAL: ${mon(pedido.totalFinal)}</div>
    <div class="linea-dash"></div>
    <div class="footer">¡Gracias por su visita!</div>

    <div class="no-print">
        <button onclick="window.print()">🖨 Imprimir ticket</button>
    </div>

    <script>
        window.onload = function () {
            setTimeout(function () { window.print(); }, 400);
        };
    <\/script>

</body>
</html>`;

    const ventanaImpresion = window.open('', '_blank', 'width=280,height=700');
    ventanaImpresion.document.write(htmlFinal);
    ventanaImpresion.document.close();
}

// ============================================
// GESTIÓN DE GASTOS
// ============================================

let guardandoGasto = false;
async function guardarGasto() {
    if (guardandoGasto) return;
    
    const fecha = document.getElementById('gasto-fecha').value;
    const categoria = document.getElementById('gasto-categoria').value;
    const concepto = document.getElementById('gasto-concepto').value.trim();
    const monto = parseFloat(document.getElementById('gasto-monto').value);
    
    if (!fecha || !categoria || !concepto || monto <= 0) {
        mostrarMensaje('Por favor completa todos los campos del gasto', 'error');
        return;
    }
    
    const nuevoGasto = {
        id: Date.now(),
        fecha: fecha,
        categoria: categoria,
        concepto: concepto,
        monto: monto
    };
    
    gastos.push(nuevoGasto);
    
    guardandoGasto = true;
    const formGasto = document.getElementById('form-gasto');
    const btnGasto = formGasto ? formGasto.querySelector('button[type="submit"]') : null;
    if (btnGasto) { btnGasto.disabled = true; btnGasto.textContent = '⏳ Guardando...'; }
    
    try {
        await guardarGastos();
    } finally {
        guardandoGasto = false;
        if (btnGasto) { btnGasto.disabled = false; btnGasto.textContent = '💾 Guardar Gasto'; }
    }
    
    if (formGasto) formGasto.reset();
    const gastoFechaEl = document.getElementById('gasto-fecha');
    if (gastoFechaEl) gastoFechaEl.value = obtenerFechaLocal();
    
    actualizarDashboard();
    
    const filtroCategoria = document.getElementById('filtro-categoria');
    const categoriaFiltro = filtroCategoria ? filtroCategoria.value : '';
    mostrarGastos(categoriaFiltro);
    
    mostrarMensaje(`✅ Gasto registrado: ${concepto} - ${formatearMoneda(monto)}`, 'success');
}

function mostrarGastos(categoriaFiltro = '') {
    const container = document.getElementById('gastos-list');
    if (!container) return;
    
    // Filtrar gastos por categoría si se especifica
    let gastosFiltrados = gastos;
    if (categoriaFiltro) {
        gastosFiltrados = gastos.filter(g => g.categoria === categoriaFiltro);
    }
    
    if (gastosFiltrados.length === 0) {
        if (categoriaFiltro) {
            container.innerHTML = `<div class="empty-state">💰 No hay gastos registrados en la categoría "${categoriaFiltro}"</div>`;
        } else {
            container.innerHTML = '<div class="empty-state">💰 No hay gastos registrados</div>';
        }
        return;
    }
    
    const gastosOrdenados = [...gastosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    container.innerHTML = gastosOrdenados.map(gasto => `
        <div class="gasto-card">
            <div class="gasto-info">
                <h4>${gasto.concepto}</h4>
                <p>📅 ${formatearFecha(gasto.fecha)}${gasto.categoria ? ` | 📁 ${gasto.categoria}` : ''}</p>
            </div>
            <div class="gasto-monto">
                <span class="monto">${formatearMoneda(gasto.monto)}</span>
                <button class="btn-eliminar-small" onclick="eliminarGasto(${gasto.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function eliminarGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;
    
    const confirmar = confirm(`¿Eliminar gasto "${gasto.concepto}"?\nMonto: ${formatearMoneda(gasto.monto)}`);
    if (!confirmar) return;
    
    gastos = gastos.filter(g => g.id !== id);
    await guardarGastos();
    
    actualizarDashboard();
    
    // Mantener el filtro activo si hay uno seleccionado
    const filtroCategoria = document.getElementById('filtro-categoria');
    const categoriaFiltro = filtroCategoria ? filtroCategoria.value : '';
    mostrarGastos(categoriaFiltro);
    
    mostrarMensaje('🗑️ Gasto eliminado correctamente', 'success');
}

// ============================================
// DASHBOARD
// ============================================

function actualizarDashboard() {
    const ventasArr = Array.isArray(ventas) ? ventas : [];
    const gastosArr = Array.isArray(gastos) ? gastos : [];
    
    const hoy = obtenerFechaLocal();
    const inicioSemana = obtenerInicioSemana(hoy);
    const finSemana = obtenerFinSemana(hoy);
    const inicioMes = hoy.substring(0, 7);
    
    // Calcular totales de ventas
    const ventasHoy = ventasArr.filter(v => v && v.fecha === hoy);
    const ventasSemana = ventasArr.filter(v => v && v.fecha >= inicioSemana && v.fecha <= finSemana);
    const ventasMes = ventasArr.filter(v => v && v.fecha && v.fecha.startsWith(inicioMes));
    
    const ingresoHoy = ventasHoy.reduce((sum, v) => sum + (v.totalFinal || 0), 0);
    const ingresoSemana = ventasSemana.reduce((sum, v) => sum + (v.totalFinal || 0), 0);
    const ingresoMes = ventasMes.reduce((sum, v) => sum + (v.totalFinal || 0), 0);
    const ingresoTotal = ventasArr.reduce((sum, v) => sum + (v.totalFinal || 0), 0);
    
    // Calcular totales de gastos
    const gastosHoy = gastosArr.filter(g => g && g.fecha === hoy);
    const gastosSemana = gastosArr.filter(g => g && g.fecha >= inicioSemana && g.fecha <= finSemana);
    const gastosMes = gastosArr.filter(g => g && g.fecha && g.fecha.startsWith(inicioMes));
    
    const gastoHoy = gastosHoy.reduce((sum, g) => sum + (g.monto || 0), 0);
    const gastoSemana = gastosSemana.reduce((sum, g) => sum + (g.monto || 0), 0);
    const gastoMes = gastosMes.reduce((sum, g) => sum + (g.monto || 0), 0);
    const gastoTotal = gastosArr.reduce((sum, g) => sum + (g.monto || 0), 0);
    
    // Calcular saldos
    const saldoHoy = ingresoHoy - gastoHoy;
    const saldoSemana = ingresoSemana - gastoSemana;
    const saldoMes = ingresoMes - gastoMes;
    const saldoTotal = ingresoTotal - gastoTotal;
    
    // Calcular propinas
    const propinasHoy = ventasHoy.reduce((sum, v) => sum + (v.propina || 0), 0);
    const propinasSemana = ventasSemana.reduce((sum, v) => sum + (v.propina || 0), 0);
    const propinasMes = ventasMes.reduce((sum, v) => sum + (v.propina || 0), 0);
    
    // Ventas pagadas vs pendientes
    const ventasPagadasHoy = ventasHoy.filter(v => v && v.estaPagado);
    const ventasPendientesHoy = ventasHoy.filter(v => v && !v.estaPagado);
    const totalPagadoHoy = ventasPagadasHoy.reduce((sum, v) => sum + v.totalFinal, 0);
    const totalPendienteHoy = ventasPendientesHoy.reduce((sum, v) => sum + v.totalFinal, 0);
    
    // Actualizar DOM
    const actualizarElemento = (id, valor) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = formatearMoneda(valor);
    };
    
    actualizarElemento('ingreso-hoy', ingresoHoy);
    actualizarElemento('ingreso-semana', ingresoSemana);
    actualizarElemento('ingreso-mes', ingresoMes);
    actualizarElemento('ingreso-total', ingresoTotal);
    
    actualizarElemento('gasto-hoy', gastoHoy);
    actualizarElemento('gasto-semana', gastoSemana);
    actualizarElemento('gasto-mes', gastoMes);
    actualizarElemento('gasto-total', gastoTotal);
    
    actualizarElemento('saldo-hoy', saldoHoy);
    actualizarElemento('saldo-semana', saldoSemana);
    actualizarElemento('saldo-mes', saldoMes);
    actualizarElemento('saldo-total', saldoTotal);
    
    // Actualizar Total General en resumen por período
    const elemTotalGeneral = document.getElementById('saldo-total-general');
    if (elemTotalGeneral) {
        elemTotalGeneral.textContent = formatearMoneda(saldoTotal);
    }
    
    // Actualizar gráfica
    actualizarGrafica();
}

function actualizarGrafica() {
    const canvas = document.getElementById('chart-ventas');
    if (!canvas) return;
    if (typeof Chart === 'undefined') return; // Chart.js puede cargar con defer y no estar aún
    
    const ctx = canvas.getContext('2d');
    const hoy = new Date(obtenerFechaLocal());
    
    // Últimos 7 días
    const labels = [];
    const dataIngresos = [];
    const dataGastos = [];
    
    const ventasArr = Array.isArray(ventas) ? ventas : [];
    const gastosArr = Array.isArray(gastos) ? gastos : [];
    
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        labels.push(formatearFechaCorta(fechaStr));
        
        const ventasDia = ventasArr.filter(v => v && v.fecha === fechaStr);
        const gastosDia = gastosArr.filter(g => g && g.fecha === fechaStr);
        
        dataIngresos.push(ventasDia.reduce((sum, v) => sum + v.totalFinal, 0));
        dataGastos.push(gastosDia.reduce((sum, g) => sum + g.monto, 0));
    }
    
    if (window.chartVentas) {
        window.chartVentas.destroy();
    }
    
    window.chartVentas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: dataIngresos,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: dataGastos,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// REPORTES AVANZADOS
// ============================================

function generarReporteSemanal() {
    const hoy = obtenerFechaLocal();
    const inicioSemana = obtenerInicioSemana(hoy);
    const finSemana = obtenerFinSemana(hoy);
    
    const ventasSemana = ventas.filter(v => v.fecha >= inicioSemana && v.fecha <= finSemana);
    
    if (ventasSemana.length === 0) {
        mostrarMensaje('No hay datos para generar reporte semanal', 'info');
        return;
    }
    
    // Agrupar platillos por día
    const platillosPorDia = {};
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    ventasSemana.forEach(pedido => {
        const fecha = new Date(pedido.fecha + 'T00:00:00');
        const diaSemana = diasSemana[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
        
        if (!platillosPorDia[diaSemana]) {
            platillosPorDia[diaSemana] = {};
        }
        
        pedido.articulos.forEach(art => {
            if (!platillosPorDia[diaSemana][art.descripcion]) {
                platillosPorDia[diaSemana][art.descripcion] = 0;
            }
            platillosPorDia[diaSemana][art.descripcion] += art.cantidad;
        });
    });
    
    // Clientes frecuentes
    const clientesMap = {};
    ventasSemana.forEach(pedido => {
        if (!clientesMap[pedido.cliente]) {
            clientesMap[pedido.cliente] = {
                nombre: pedido.cliente,
                visitas: 0,
                consumoTotal: 0,
                pedidos: []
            };
        }
        clientesMap[pedido.cliente].visitas++;
        clientesMap[pedido.cliente].consumoTotal += pedido.totalFinal;
        clientesMap[pedido.cliente].pedidos.push({
            fecha: pedido.fecha,
            articulos: pedido.articulos.map(a => a.descripcion).join(', '),
            total: pedido.totalFinal
        });
    });
    
    const clientesFrecuentes = Object.values(clientesMap)
        .filter(c => c.visitas >= 2)
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 5);
    
    // Mesero top
    const meseroMap = {};
    ventasSemana.forEach(pedido => {
        if (!meseroMap[pedido.mesero]) {
            meseroMap[pedido.mesero] = 0;
        }
        meseroMap[pedido.mesero] += pedido.totalFinal;
    });
    
    const meseroTop = Object.entries(meseroMap)
        .sort((a, b) => b[1] - a[1])[0];
    
    const totalSemana = ventasSemana.reduce((sum, v) => sum + v.totalFinal, 0);
    
    // Platillo estrella
    const todosLosPlatillos = {};
    ventasSemana.forEach(pedido => {
        pedido.articulos.forEach(art => {
            if (!todosLosPlatillos[art.descripcion]) {
                todosLosPlatillos[art.descripcion] = 0;
            }
            todosLosPlatillos[art.descripcion] += art.cantidad;
        });
    });
    
    const platilloEstrella = Object.entries(todosLosPlatillos)
        .sort((a, b) => b[1] - a[1])[0];
    
    // Generar HTML del reporte
    let reporteHTML = `
        <div class="reporte-container">
            <h2>📊 Reporte Semanal</h2>
            <p class="reporte-fecha">Del ${formatearFecha(inicioSemana)} al ${formatearFecha(finSemana)}</p>
            
            <div class="reporte-seccion">
                <h3>🍽️ Platillos Más Vendidos por Día</h3>
                ${diasSemana.map(dia => {
                    const platillos = platillosPorDia[dia];
                    if (!platillos || Object.keys(platillos).length === 0) {
                        return `<p><strong>${dia}:</strong> Sin ventas</p>`;
                    }
                    const top3 = Object.entries(platillos)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3);
                    return `
                        <p><strong>${dia}:</strong></p>
                        <ul>
                            ${top3.map((p, i) => `<li>${i + 1}. ${p[0]} (${p[1]} órdenes)</li>`).join('')}
                        </ul>
                    `;
                }).join('')}
            </div>
            
            <div class="reporte-seccion">
                <h3>👥 Clientes Frecuentes</h3>
                ${clientesFrecuentes.length > 0 ? clientesFrecuentes.map(cliente => `
                    <div class="cliente-card">
                        <h4>👤 ${cliente.nombre}</h4>
                        <p>Visitas: ${cliente.visitas} | Consumo Total: ${formatearMoneda(cliente.consumoTotal)}</p>
                        <ul>
                            ${cliente.pedidos.map(p => `
                                <li>${formatearFecha(p.fecha)}: ${p.articulos} (${formatearMoneda(p.total)})</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('') : '<p>No hay clientes frecuentes (2+ visitas) esta semana</p>'}
            </div>
            
            <div class="reporte-seccion">
                <h3>📈 Patrones de Consumo</h3>
                <ul>
                    <li>🍕 <strong>Platillo estrella:</strong> ${platilloEstrella[0]} (${platilloEstrella[1]} vendidos)</li>
                    ${meseroTop ? `<li>👥 <strong>Mesero top:</strong> ${meseroTop[0]} (${formatearMoneda(meseroTop[1])} en ventas)</li>` : ''}
                    <li>💰 <strong>Total semanal:</strong> ${formatearMoneda(totalSemana)}</li>
                    <li>📊 <strong>Promedio por día:</strong> ${formatearMoneda(totalSemana / 7)}</li>
                </ul>
            </div>
        </div>
    `;
    
    // Mostrar en modal o nueva ventana
    const ventanaReporte = window.open('', '_blank', 'width=800,height=600');
    ventanaReporte.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte Semanal</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                h2 { color: #2196F3; text-align: center; }
                h3 { color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
                .reporte-fecha { text-align: center; color: #666; margin-bottom: 30px; }
                .reporte-seccion { margin-bottom: 30px; background: #f5f5f5; padding: 15px; border-radius: 8px; }
                .cliente-card { background: white; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
                ul { line-height: 1.8; }
                @media print { 
                    body { max-width: 100%; }
                    .reporte-seccion { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${reporteHTML}
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🖨️ Imprimir Reporte
                </button>
            </div>
        </body>
        </html>
    `);
    
    mostrarMensaje('✅ Reporte semanal generado', 'success');
}

// ============================================
// EXPORTAR A PDF
// ============================================

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurar fuente monospace para alineación
    doc.setFont('courier');
    
    const hoy = obtenerFechaLocal();
    let y = 20;
    let totalGeneral = 0;
    
    // Título del reporte
    doc.setFontSize(16);
    doc.setFont('courier', 'bold');
    doc.text('REPORTE DE PEDIDOS - RESTAURANTE', 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.text(formatearFecha(hoy), 105, y, { align: 'center' });
    y += 15;
    
    // Procesar cada pedido
    ventas.forEach((pedido, index) => {
        // Verificar espacio en página
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        // Separador
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 8;
        
        // Datos de la mesa
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.text(`MESA: ${pedido.mesa}`, 20, y);
        doc.text(`FECHA: ${formatearFecha(pedido.fecha)}`, 120, y);
        y += 6;
        
        doc.setFont('courier', 'normal');
        doc.text(`MESERO: ${pedido.mesero}`, 20, y);
        y += 6;
        doc.text(`CLIENTE: ${pedido.cliente}`, 20, y);
        y += 10;
        
        // Encabezado de tabla
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.text('DESCRIPCION', 20, y);
        doc.text('PRECIO', 100, y);
        doc.text('CANT', 130, y);
        doc.text('SUB_TOTAL', 155, y);
        y += 2;
        doc.line(20, y, 190, y);
        y += 6;
        
        // Artículos
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        pedido.articulos.forEach(art => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            
            const precio = art.precioUnitario || art.precio || 0;
            const descripcion = art.descripcion.length > 25 ? art.descripcion.substring(0, 22) + '...' : art.descripcion;
            
            doc.text(descripcion, 20, y);
            doc.text(formatearMoneda(precio), 100, y);
            doc.text(art.cantidad.toString(), 135, y, { align: 'right' });
            doc.text(formatearMoneda(art.subtotal), 180, y, { align: 'right' });
            y += 6;
        });
        
        y += 2;
        doc.line(20, y, 190, y);
        y += 6;
        
        // Total del pedido
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL:', 140, y);
        doc.text(formatearMoneda(pedido.totalFinal), 180, y, { align: 'right' });
        y += 15;
        
        totalGeneral += pedido.totalFinal;
    });
    
    // Total general de pedidos
    y += 5;
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text('TOTAL GENERAL PEDIDOS:', 100, y);
    doc.text(formatearMoneda(totalGeneral), 180, y, { align: 'right' });
    
    // Nueva página para gastos
    doc.addPage();
    y = 20;
    
    doc.setFontSize(16);
    doc.setFont('courier', 'bold');
    doc.text('REPORTE DE GASTOS', 105, y, { align: 'center' });
    y += 8;
    
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    
    let totalGastosAcumulado = 0;
    
    if (gastos.length === 0) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.text('No hay gastos registrados', 20, y);
        y += 10;
    } else {
        // Encabezado de tabla de gastos
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.text('FECHA', 20, y);
        doc.text('CATEGORIA', 60, y);
        doc.text('CONCEPTO', 110, y);
        doc.text('MONTO', 160, y);
        y += 2;
        doc.line(20, y, 190, y);
        y += 6;
        
        // Gastos ordenados por fecha
        const gastosOrdenados = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        gastosOrdenados.forEach(gasto => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            
            const fechaFormateada = formatearFecha(gasto.fecha);
            const concepto = gasto.concepto.length > 20 ? gasto.concepto.substring(0, 17) + '...' : gasto.concepto;
            const categoria = gasto.categoria.length > 12 ? gasto.categoria.substring(0, 9) + '...' : gasto.categoria;
            
            doc.text(fechaFormateada, 20, y);
            doc.text(categoria, 60, y);
            doc.text(concepto, 110, y);
            doc.text(formatearMoneda(gasto.monto), 180, y, { align: 'right' });
            y += 6;
            
            totalGastosAcumulado += gasto.monto;
        });
        
        // Total de gastos
        y += 2;
        doc.line(20, y, 190, y);
        y += 6;
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL GASTOS:', 140, y);
        doc.text(formatearMoneda(totalGastosAcumulado), 180, y, { align: 'right' });
        y += 10;
    }
    
    // Resumen final
    y += 5;
    if (y > 250) {
        doc.addPage();
        y = 20;
    }
    
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text('RESUMEN FINANCIERO', 105, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    doc.text(`Total Pedidos: ${formatearMoneda(totalGeneral)}`, 20, y);
    y += 7;
    doc.text(`Total Gastos: ${formatearMoneda(totalGastosAcumulado)}`, 20, y);
    y += 7;
    doc.setFont('courier', 'bold');
    const saldoFinal = totalGeneral - totalGastosAcumulado;
    doc.text(`Saldo Neto: ${formatearMoneda(saldoFinal)}`, 20, y);
    
    // Guardar PDF
    doc.save(`reporte-completo-${hoy}.pdf`);
    mostrarMensaje('✅ PDF exportado correctamente', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function obtenerFechaLocal() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-MX', opciones);
}

function formatearFechaCorta(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    return `${dia}/${mes}`;
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(valor);
}

function obtenerInicioSemana(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dia = fecha.getDay();
    const diff = dia === 0 ? -6 : 1 - dia; // Lunes como inicio
    fecha.setDate(fecha.getDate() + diff);
    return fecha.toISOString().split('T')[0];
}

function obtenerFinSemana(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dia = fecha.getDay();
    const diff = dia === 0 ? 0 : 7 - dia; // Domingo como fin
    fecha.setDate(fecha.getDate() + diff);
    return fecha.toISOString().split('T')[0];
}

function mostrarMensaje(texto, tipo = 'info') {
    if (texto == null || texto === '') return;
    
    const container = document.getElementById('mensaje-container') || crearContenedorMensajes();
    
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje mensaje-${tipo}`;
    mensaje.textContent = texto;
    
    container.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

function crearContenedorMensajes() {
    const container = document.createElement('div');
    container.id = 'mensaje-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    
    const style = document.createElement('style');
    style.textContent = `
        .mensaje {
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            font-weight: 500;
        }
        .mensaje-success { background: #4CAF50; color: white; }
        .mensaje-error { background: #f44336; color: white; }
        .mensaje-info { background: #2196F3; color: white; }
        .mensaje-warning { background: #ff9800; color: white; }
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    return container;
}

// ============================================
// RESPALDO Y RESTAURACIÓN
// ============================================

function verificarRecordatorioRespaldo() {
    const ultimoRespaldo = localStorage.getItem('ultimo_respaldo');
    if (!ultimoRespaldo) return;
    
    const hoy = new Date();
    const fechaRespaldo = new Date(ultimoRespaldo);
    const diasDesdeRespaldo = Math.floor((hoy - fechaRespaldo) / (1000 * 60 * 60 * 24));
    
    if (diasDesdeRespaldo >= 7) {
        setTimeout(() => {
            mostrarMensaje('⚠️ Han pasado ' + diasDesdeRespaldo + ' días desde el último respaldo. Considera exportar tus datos.', 'warning');
        }, 2000);
    }
}

function exportarDatos() {
    const datos = {
        version: DB_VERSION,
        fecha: obtenerFechaLocal(),
        ventas: ventas,
        gastos: gastos
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-restaurante-${obtenerFechaLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    localStorage.setItem('ultimo_respaldo', new Date().toISOString());
    mostrarMensaje('✅ Datos exportados correctamente', 'success');
}

function importarDatos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const datos = JSON.parse(text);
            
            if (!datos.ventas || !datos.gastos) {
                throw new Error('Formato de archivo inválido');
            }
            
            const confirmar = confirm(`¿Importar respaldo del ${datos.fecha}?\n\nEsto REEMPLAZARÁ todos los datos actuales.\n\nVentas: ${datos.ventas.length}\nGastos: ${datos.gastos.length}`);
            
            if (!confirmar) return;
            
            ventas = datos.ventas;
            gastos = datos.gastos;
            
            await guardarVentas();
            await guardarGastos();
            
            actualizarDashboard();
            mostrarPedidos();
            mostrarGastos();
            
            mostrarMensaje('✅ Datos importados correctamente', 'success');
            
        } catch (error) {
            console.error('Error al importar:', error);
            mostrarMensaje('❌ Error al importar el archivo', 'error');
        }
    };
    
    input.click();
}

// ============================================
// INSTALACIÓN PWA
// ============================================

// Detectar si es iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detectar si es Android
function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

// Función para limpiar manualmente service workers y caches (útil para debugging)
async function limpiarTodoManualmente() {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los service workers y caches? Esto puede afectar el funcionamiento offline.')) {
        return;
    }
    
    try {
        // Desregistrar todos los service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
                console.log('✅ Service worker desregistrado');
            }
        }
        
        // Eliminar todos los caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (let cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log('✅ Cache eliminado:', cacheName);
            }
        }
        
        // Limpiar localStorage relacionado con PWA
        localStorage.removeItem('install_banner_dismissed');
        
        alert('✅ Limpieza completada. Recarga la página para continuar.');
        window.location.reload();
    } catch (error) {
        console.error('❌ Error al limpiar:', error);
        alert('Error al limpiar. Revisa la consola para más detalles.');
    }
}

// Exponer función globalmente para debugging
window.limpiarPWAs = limpiarTodoManualmente;

function configurarInstalacionPWA() {
    const btnInstall = document.getElementById('install-btn');
    const btnDismiss = document.getElementById('dismiss-install');
    const installBanner = document.getElementById('install-banner');
    
    // Configurar botón de instalación
    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            // Android/Chrome - usar deferredPrompt
            if (deferredPrompt) {
                try {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    
                    console.log(`Resultado de instalación: ${outcome}`);
                    
                    if (outcome === 'accepted') {
                        mostrarMensaje('✅ App instalada correctamente', 'success');
                    } else {
                        mostrarMensaje('Instalación cancelada', 'info');
                    }
                    
                    deferredPrompt = null;
                    
                    if (installBanner) {
                        installBanner.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error al instalar:', error);
                    mostrarMensaje('Error al instalar la app', 'error');
                }
            } 
            // iOS - mostrar instrucciones
            else if (isIOS()) {
                mostrarInstruccionesIOS();
                if (installBanner) {
                    installBanner.style.display = 'none';
                }
            } 
            // Otros navegadores
            else {
                mostrarMensaje('La instalación no está disponible en este momento. Intenta desde el menú del navegador.', 'warning');
            }
        });
    }
    
    // Configurar botón de descartar
    if (btnDismiss) {
        btnDismiss.addEventListener('click', () => {
            if (installBanner) {
                installBanner.style.display = 'none';
            }
            localStorage.setItem('install_banner_dismissed', 'true');
        });
    }
    
    // Para iOS, mostrar instrucciones si no está instalada
    if (isIOS() && !isAppInstalled() && !wasBannerDismissed()) {
        // Mostrar banner con instrucciones específicas para iOS después de un delay
        setTimeout(() => {
            mostrarBannerInstalacion();
            
            // Actualizar texto del banner para iOS
            if (installBanner) {
                const bannerText = document.getElementById('install-banner-text');
                if (bannerText) {
                    bannerText.textContent = '📱 Instala esta app: Toca el botón Compartir (□↑) y selecciona "Agregar a pantalla de inicio"';
                }
            }
        }, 3000);
    }
}

// Mostrar instrucciones de instalación para iOS
function mostrarInstruccionesIOS() {
    const instrucciones = `
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 400px; margin: 20px auto;">
            <h3 style="color: #2563eb; margin-bottom: 15px;">📱 Instalar en iOS</h3>
            <ol style="text-align: left; line-height: 1.8;">
                <li>Toca el botón <strong>Compartir</strong> (□↑) en la barra inferior</li>
                <li>Desplázate y selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
                <li>Toca <strong>"Agregar"</strong> para confirmar</li>
            </ol>
            <button onclick="this.parentElement.remove()" 
                    style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                Entendido
            </button>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    modal.innerHTML = instrucciones;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    document.body.appendChild(modal);
}

// ============================================
// EVENTOS ADICIONALES
// ============================================

// Eventos adicionales al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // El botón ya tiene onclick en HTML, no necesitamos duplicar el event listener
    
    // Botón de reporte semanal
    const btnReporteSemanal = document.getElementById('btn-reporte-semanal');
    if (btnReporteSemanal) {
        btnReporteSemanal.addEventListener('click', generarReporteSemanal);
    }
    
    // Botón de exportar PDF
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarPDF);
    }
    
    // Botones de respaldo
    const btnExportar = document.getElementById('btn-exportar-datos');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarDatos);
    }
    
    const btnImportar = document.getElementById('btn-importar-datos');
    if (btnImportar) {
        btnImportar.addEventListener('click', importarDatos);
    }
});


// ============================================
// EXPONER FUNCIONES GLOBALMENTE (window)
// ============================================

window.agregarArticulo = agregarArticulo;
window.eliminarArticuloTemp = eliminarArticuloTemp;
window.eliminarFila = eliminarFila;
window.calcularSubtotalArticulo = calcularSubtotalArticulo;
window.calcularSubtotalFila = calcularSubtotalFila;
window.calcularTotalPedido = calcularTotalPedido;
window.editarPedido = editarPedido;
window.eliminarPedido = eliminarPedido;
window.eliminarGasto = eliminarGasto;
window.generarReporteSemanal = generarReporteSemanal;
window.exportarPDF = exportarPDF;
window.exportarDatos = exportarDatos;
window.importarDatos = importarDatos;
window.configurarInstalacionPWA = configurarInstalacionPWA;
window.diagnosticarPWA = diagnosticarPWA;