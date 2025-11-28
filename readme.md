# 📊 Sistema de Contabilidad - Guía Completa

## 🎯 ¿Qué es este sistema?

Este es un sistema completo de contabilidad para tu negocio pequeño que te permite:
- Registrar todas tus ventas diarias
- Registrar todos tus gastos/egresos
- Ver tu saldo en tiempo real (día, semana, mes, total)
- Generar reportes detallados con gráficas
- Exportar reportes a PDF
- Hacer respaldos de tus datos

**Lo mejor de todo:** Funciona completamente en tu computadora, sin necesidad de internet ni servidores complicados. Tus datos se guardan localmente en tu navegador.

---

## 🚀 Instrucciones de Instalación y Uso

### Paso 1: Descargar los archivos

Asegúrate de tener estos archivos en una misma carpeta:
- `index.html`
- `estilos.css`
- `app.js`
- `manifest.json` (NUEVO - para PWA)
- `service-worker.js` (NUEVO - para funcionalidad offline)
- `icon-192.png` (NUEVO - icono 192x192)
- `icon-512.png` (NUEVO - icono 512x512)
- `generar-iconos.html` (NUEVO - herramienta para generar iconos)
- `README.md` (este archivo)

**📝 IMPORTANTE - Generar Iconos:**

Si no tienes los archivos `icon-192.png` e `icon-512.png`:
1. Abre el archivo `generar-iconos.html` en tu navegador
2. Haz clic en "Descargar icon-192.png"
3. Haz clic en "Descargar icon-512.png"
4. Guarda ambos archivos en la misma carpeta que `index.html`

### Paso 2: Iniciar Servidor Local (IMPORTANTE para PWA)

**⚠️ IMPORTANTE:** Las PWAs requieren un servidor HTTP para funcionar. No puedes abrir directamente el archivo con `file://`.

#### Opción 1: Usar el Script Automático (RECOMENDADO)

**Windows:**
1. Haz doble clic en `iniciar-servidor.bat`
2. Se abrirá una ventana negra (PowerShell/CMD)
3. Espera a que diga "Iniciando servidor en http://localhost:8000"
4. Abre tu navegador y ve a: `http://localhost:8000/index.html`

**Mac/Linux:**
1. Abre Terminal en la carpeta del proyecto
2. Ejecuta: `chmod +x iniciar-servidor.sh`
3. Ejecuta: `./iniciar-servidor.sh`
4. Abre tu navegador y ve a: `http://localhost:8000/index.html`

#### Opción 2: Usar Python Manualmente

**Windows:**
```cmd
cd C:\Users\Gabriel\Desktop\prueba
python -m http.server 8000
```

**Mac/Linux:**
```bash
cd ~/Desktop/prueba
python3 -m http.server 8000
```

Luego abre: `http://localhost:8000/index.html`

#### Opción 3: Ver Instrucciones Detalladas

Abre el archivo `servidor-local.html` en tu navegador para ver todas las opciones disponibles.

### Paso 3: Abrir el sistema según tu dispositivo

#### En Computadora (Windows, Mac, Linux)

**IMPORTANTE:** Primero inicia el servidor local (Paso 2), luego:

1. Abre tu navegador web (Chrome, Firefox, Edge, etc.)
2. Ve a: `http://localhost:8000/index.html`
3. ¡Listo! El sistema debería abrirse correctamente

**⚠️ NO uses:** `file://` o doble clic directo en `index.html` - esto no funcionará para PWA.

#### En Android (Teléfono/Tablet)

**Opción A: Usar Servidor Local (Recomendado para PWA)**

1. **En tu computadora:**
   - Inicia el servidor local (Paso 2)
   - Asegúrate de que tu teléfono y computadora estén en la misma red WiFi

2. **Obtener la IP de tu computadora:**
   - Windows: Abre CMD y escribe `ipconfig` (busca "IPv4 Address")
   - Mac/Linux: Abre Terminal y escribe `ifconfig` o `ip addr`

3. **En tu teléfono:**
   - Abre Chrome
   - Ve a: `http://TU-IP:8000/index.html` (ejemplo: `http://192.168.1.100:8000/index.html`)

**Opción B: Usar Archivos Locales (Sin PWA)**

1. **Preparar los archivos:**
   - Copia la carpeta completa con todos los archivos a tu teléfono
   - Puedes usar USB, Google Drive, Dropbox, o cualquier método que prefieras

2. **Abrir en Chrome:**
   - Abre la aplicación "Chrome" en tu teléfono
   - Ve a la ubicación donde copiaste los archivos
   - Toca en el archivo `index.html`
   - El sistema se abrirá en Chrome (pero NO podrás instalar como PWA)

3. **Agregar a pantalla de inicio (Recomendado):**
   - Una vez abierto el sistema, toca el menú (tres puntos) en Chrome
   - Selecciona "Agregar a pantalla de inicio" o "Instalar app"
   - Dale un nombre si quieres (ej: "Mi Contabilidad")
   - Ahora tendrás un ícono en tu pantalla de inicio
   - Cada vez que toques el ícono, el sistema se abrirá como una app

#### En iPhone/iPad

1. **Preparar los archivos:**
   - Copia la carpeta completa con todos los archivos a tu dispositivo
   - Usa iCloud Drive, AirDrop, o cualquier método

2. **Abrir en Safari:**
   - Abre la aplicación "Safari" (el navegador nativo)
   - Usa el app "Archivos" para navegar a donde copiaste los archivos
   - Toca en el archivo `index.html`
   - El sistema se abrirá en Safari

3. **Agregar a pantalla de inicio (Recomendado):**
   - En la parte inferior de Safari, toca el botón de compartir (cuadrado con flecha)
   - Desplázate y toca "Añadir a pantalla de inicio"
   - Dale un nombre si quieres (ej: "Mi Contabilidad")
   - Toca "Añadir"
   - Ahora tendrás un ícono en tu pantalla de inicio
   - Cada vez que toques el ícono, el sistema se abrirá como una app

### Paso 3: Verificar que el almacenamiento funciona

Al abrir el sistema, verás un indicador en la parte superior del encabezado:

- **✅ Datos guardados correctamente** - Verde = Todo funciona perfecto
- **⚠️ Usando respaldo (localStorage)** - Amarillo = Funciona pero con respaldo alternativo
- **❌ Error: No se pueden guardar datos** - Rojo = Problemas de almacenamiento

**Si ves el indicador rojo:**
- En móviles: Verifica que no estés en modo incógnito
- Verifica los permisos de almacenamiento del navegador
- Intenta cerrar y volver a abrir el navegador
- Haz respaldos frecuentes usando "Exportar Datos"

### Paso 4: Instalar como PWA (Progressive Web App) - RECOMENDADO

**🎉 ¡Ahora puedes instalar la app como una aplicación nativa!**

El sistema ahora es una **PWA completa** que puede:
- ✅ Instalarse como app en tu teléfono/computadora
- ✅ Funcionar **completamente offline** (sin internet)
- ✅ Verse como una app real (sin barra del navegador)
- ✅ Tener un ícono en tu pantalla de inicio/escritorio

#### 📱 Instalar en Android (Chrome)

**IMPORTANTE:** Primero necesitas usar un servidor local (no `file://`).

1. **Inicia el servidor local** en tu computadora (Paso 2)
2. **Abre en Chrome** desde tu teléfono usando la IP de tu computadora:
   - Ejemplo: `http://192.168.1.100:8000/index.html`
   - (Sustituye `192.168.1.100` por la IP de tu computadora)
3. Verás un **banner morado** en la parte inferior que dice "📱 Instala esta app para acceso rápido"
4. Toca el botón **"Instalar Ahora"**
5. Confirma la instalación en el diálogo que aparece
6. ¡Listo! La app se instalará y aparecerá en tu pantalla de inicio
7. Ábrela desde ahí - se verá como una app real (sin barra del navegador)

**Si no aparece el banner:**
- Verifica que estés usando `http://` y no `file://`
- Toca el menú de Chrome (tres puntos) → "Instalar app" o "Agregar a pantalla de inicio"
- Asegúrate de que tengas los archivos `manifest.json` y los iconos en la misma carpeta
- Verifica que el servidor local esté corriendo

#### 🍎 Instalar en iPhone/iPad (Safari)

1. Abre `index.html` en Safari (en tu iPhone)
2. Toca el botón de **"Compartir"** (cuadrado con flecha hacia arriba) en la parte inferior
3. Desplázate hacia abajo y toca **"Agregar a pantalla de inicio"**
4. Toca **"Agregar"** en la esquina superior derecha
5. ¡Listo! La app aparecerá en tu pantalla de inicio con un ícono
6. Ábrela desde ahí - se verá como una app real (sin barra del navegador)

**Nota:** En iPhone, el banner automático no aparece, pero puedes agregarla manualmente usando el botón de compartir.

#### 💻 Instalar en Computadora (Chrome/Edge)

**IMPORTANTE:** Primero necesitas usar un servidor local (no `file://`).

1. **Inicia el servidor local** (Paso 2)
2. **Abre en Chrome o Edge**: `http://localhost:8000/index.html`
3. Verás un banner en la parte inferior que dice "📱 Instala esta app para acceso rápido"
4. Haz clic en **"Instalar Ahora"**
5. Confirma la instalación en el diálogo que aparece
6. ¡Listo! La app se instalará y aparecerá como una aplicación independiente
7. Ábrela desde el menú de inicio o escritorio - se abrirá en su propia ventana

**⚠️ Si no ves el banner:**
- Verifica que estés usando `http://localhost:8000/index.html` y no `file://`
- Asegúrate de que el servidor local esté corriendo
- Verifica que tengas los archivos `manifest.json` y los iconos en la misma carpeta

**Ventajas de instalarla:**
- ✅ Se abre más rápido (archivos cacheados)
- ✅ Funciona completamente offline
- ✅ No tiene la barra del navegador (se ve como app real)
- ✅ Tiene su propio ícono y nombre "Mi Contabilidad"

#### 🔌 Funcionalidad Offline

Una vez instalada, la PWA funciona **completamente sin internet**:

- ✅ Puedes registrar ventas y gastos
- ✅ Puedes ver todos tus datos
- ✅ Puedes generar reportes
- ✅ Puedes exportar PDFs
- ✅ Todos los datos se guardan localmente

**Nota:** La primera vez que abres la app, necesita internet para descargar las librerías de gráficas. Después, todo funciona offline.

### Paso 5: Empezar a usar

Una vez abierto el sistema, verás 4 pestañas principales:
- **Dashboard:** Resumen general de tus finanzas + botones grandes de Exportar/Importar
- **Ventas:** Para registrar ventas
- **Gastos:** Para registrar gastos
- **Reportes:** Para ver análisis y gráficas

---

## 📝 Guía de Uso Detallada

### 💰 Registrar una Venta

1. Haz clic en la pestaña **"Ventas"**
2. Completa el formulario:
   - **Fecha:** Selecciona la fecha de la venta (por defecto es hoy)
   - **Descripción:** Escribe qué vendiste (ej: "Playera azul", "Consulta médica")
   - **Cantidad:** Cuántas unidades vendiste (ej: 3)
   - **Precio Unitario:** Precio de cada unidad (ej: 200.00)
   - **Total:** Se calcula automáticamente (Cantidad × Precio)
   - **Método de Pago:** Efectivo, Tarjeta o Transferencia
3. Haz clic en **"💾 Guardar Venta"**
4. Verás un mensaje de confirmación y la venta aparecerá en la tabla de abajo

**💡 Consejo:** El total se calcula automáticamente cuando escribes la cantidad y el precio.

**Ejemplo:**
- Vendiste 5 playeras a $150 cada una
- Cantidad: 5
- Precio Unitario: 150
- Total: $750.00 (automático)

---

### 💸 Registrar un Gasto

1. Haz clic en la pestaña **"Gastos"**
2. Completa el formulario:
   - **Fecha:** Selecciona la fecha del gasto (por defecto es hoy)
   - **Descripción:** Escribe qué gastaste (ej: "Renta de local", "Pago de luz")
   - **Categoría:** Selecciona el tipo de gasto:
     - Renta
     - Servicios (luz, agua, internet)
     - Inventario
     - Sueldos
     - Marketing/Publicidad
     - Mantenimiento
     - Impuestos
     - Otros
   - **Monto:** Cuánto gastaste (ej: 5000.00)
   - **Método de Pago:** Efectivo, Tarjeta o Transferencia
3. Haz clic en **"💾 Guardar Gasto"**
4. Verás un mensaje de confirmación y el gasto aparecerá en la tabla de abajo

**Ejemplo:**
- Pagaste la renta del mes: $8,000
- Descripción: "Renta de local - Enero"
- Categoría: Renta
- Monto: 8000
- Método: Transferencia

---

### 📈 Ver el Dashboard (Resumen)

El Dashboard muestra automáticamente:

1. **Ingresos del Día:** Suma de todas las ventas de hoy
2. **Gastos del Día:** Suma de todos los gastos de hoy
3. **Saldo del Día:** Ingresos - Gastos (puede ser positivo o negativo)
4. **Saldo Total:** Saldo acumulado desde que empezaste a usar el sistema
5. **Esta Semana:** Ingresos - Gastos de los últimos 7 días
6. **Este Mes:** Ingresos - Gastos del mes actual
7. **Últimas Transacciones:** Las 10 transacciones más recientes (ventas y gastos)

**💡 El Dashboard se actualiza automáticamente** cada vez que registras una venta o gasto.

---

### 📊 Generar Reportes

1. Haz clic en la pestaña **"Reportes"**
2. (Opcional) Selecciona un rango de fechas:
   - **Fecha Inicio:** Desde qué fecha quieres el reporte
   - **Fecha Fin:** Hasta qué fecha quieres el reporte
   - Si no seleccionas fechas, mostrará todos los datos
3. Haz clic en **"Generar Reporte"**

El sistema mostrará:

- **📈 Ventas por Período:**
  - Total de ventas
  - Número de ventas
  - Promedio por venta
  - Gráfica de línea con las ventas por fecha

- **💸 Gastos por Categoría:**
  - Total de gastos
  - Gráfica circular (pie chart) mostrando qué porcentaje representa cada categoría

- **💰 Ganancias Netas:**
  - Ganancia Neta = Ingresos - Egresos
  - Gráfica de barras comparando ingresos vs egresos

- **🏆 Productos Más Vendidos:**
  - Lista de los productos/servicios que más has vendido
  - Cantidad vendida y total generado

- **📅 Comparativa Mensual:**
  - Gráfica de barras mostrando ingresos y egresos de los últimos 6 meses

---

### 📥 Exportar Reporte a PDF

1. Genera un reporte (ve a la pestaña Reportes y haz clic en "Generar Reporte")
2. Haz clic en el botón **"📥 Exportar a PDF"**
3. Se descargará automáticamente un archivo PDF con:
   - Resumen general (ingresos, gastos, ganancia neta)
   - Lista de todas las ventas
   - Lista de todos los gastos
4. El archivo se guardará en tu carpeta de Descargas con un nombre como: `reporte-contabilidad-2024-01-15.pdf`

**💡 Usa esto para:** Compartir reportes con tu contador, llevar registros físicos, o presentar información a inversionistas.

---

### 💾 Respaldo de Datos - VERSIÓN MEJORADA

**🎉 Nuevo:** Ahora tienes botones **GRANDES y VISIBLES** en el Dashboard para exportar/importar.

#### 📤 Exportar (Hacer Respaldo)

1. Ve al **Dashboard** (primera pestaña)
2. Verás la sección **"💾 Respaldo de Datos"** con dos botones grandes
3. Haz clic en el botón grande **"📤 Exportar Datos"** (color morado)
4. Se descargará un archivo con el nombre: `contabilidad-backup-FECHA.json`
5. **¡MUY IMPORTANTE!** Guarda este archivo en un lugar seguro:
   - En otra carpeta de tu computadora
   - En una memoria USB
   - En la nube (Google Drive, Dropbox, WhatsApp, Email, etc.)

**💡 Recomendación:** 
- Haz respaldo al menos una vez por semana
- El sistema te recordará automáticamente cada semana si no has hecho respaldo

**📋 Información del archivo:**
- El archivo incluye todas tus ventas y gastos
- Incluye la fecha de exportación
- Puedes abrirlo con cualquier editor de texto para ver el contenido (es JSON)

#### 📥 Importar (Restaurar Respaldo)

Para usar tus datos en otro dispositivo o restaurar un respaldo:

1. Ve al **Dashboard**
2. Haz clic en el botón grande **"📥 Importar Datos"** (color rosa/rojo)
3. Selecciona el archivo JSON que exportaste anteriormente
4. **¡NUEVO!** Ahora te pregunta:
   - **OK = REEMPLAZAR** todos los datos actuales (borra todo y pone los datos importados)
   - **Cancelar = COMBINAR** con los datos actuales (agrega los datos importados sin duplicar)
5. Tus datos se importarán y verás un mensaje de confirmación

**💡 Opciones de Importación:**

- **REEMPLAZAR:** Úsalo cuando quieres restaurar un respaldo o empezar desde cero con datos específicos
- **COMBINAR:** Úsalo cuando quieres agregar datos de otro dispositivo sin perder los actuales (evita duplicados automáticamente)

**⚠️ Advertencia:** 
- Reemplazar borra todos los datos actuales
- Siempre haz un respaldo antes de importar, por si acaso

#### 🔄 Compartir Datos Entre Dispositivos

**Problema resuelto:** Ahora puedes usar los mismos datos en todos tus dispositivos.

**Pasos:**

1. **En dispositivo A (ej: tu computadora):**
   - Abre la app
   - Ve al Dashboard
   - Toca "📤 Exportar Datos"
   - El archivo `contabilidad-backup-FECHA.json` se descargará

2. **Transferir el archivo:**
   - Envíalo por WhatsApp a tu teléfono
   - Sube a Google Drive y descárgalo en el otro dispositivo
   - Envíalo por Email
   - Usa cualquier método que prefieras

3. **En dispositivo B (ej: tu teléfono):**
   - Instala la app (sigue las instrucciones de instalación PWA)
   - Abre la app
   - Ve al Dashboard
   - Toca "📥 Importar Datos"
   - Selecciona el archivo que descargaste/recibiste
   - Elige "REEMPLAZAR" para tener los mismos datos, o "COMBINAR" para agregar

4. **¡Listo!** Tus datos están ahora en ambos dispositivos.

**💡 Tips:**
- Puedes usar el mismo archivo en múltiples dispositivos
- Si usas "COMBINAR", puedes juntar datos de varios dispositivos
- Haz respaldos frecuentes en todos tus dispositivos

---

### 🗑️ Eliminar Registros

Si te equivocaste al registrar algo:

1. Ve a la pestaña **"Ventas"** o **"Gastos"**
2. En la tabla, encuentra el registro que quieres eliminar
3. Haz clic en el botón **"🗑️ Eliminar"**
4. Confirma que quieres eliminar el registro
5. El registro desaparecerá y los saldos se actualizarán automáticamente

**⚠️ Advertencia:** Esta acción no se puede deshacer.

---

### 🗑️ Borrar Todos los Datos (Nueva Función)

Si quieres empezar desde cero o cambiar de período:

1. Ve a la sección **"🗑️ Administración de Datos"** en la parte inferior
2. Haz clic en **"🗑️ Borrar Todos los Datos"**
3. Confirma la primera advertencia
4. Confirma la segunda advertencia
5. Escribe **"CONFIRMAR"** en el último mensaje
6. Todos los datos serán eliminados permanentemente

**⚠️ ADVERTENCIA CRÍTICA:** Esta acción NO SE PUEDE DESHACER. Asegúrate de exportar tus datos antes de borrar todo.

**💡 Casos de uso:**
- Empezar un nuevo período contable (año, mes, trimestre)
- Limpiar datos de prueba
- Resolver problemas de almacenamiento corrupto

---

### 🔍 Filtrar Registros

#### Filtrar Ventas

1. En la pestaña **"Ventas"**, verás la sección de filtros
2. Selecciona una fecha específica
3. Haz clic en **"Filtrar"**
4. Solo se mostrarán las ventas de esa fecha
5. Haz clic en **"Limpiar"** para ver todas las ventas de nuevo

#### Filtrar Gastos

1. En la pestaña **"Gastos"**, verás la sección de filtros
2. Selecciona una fecha específica y/o una categoría
3. Haz clic en **"Filtrar"**
4. Solo se mostrarán los gastos que coincidan con los filtros
5. Haz clic en **"Limpiar"** para ver todos los gastos de nuevo

---

## ❓ Preguntas Frecuentes

### ¿Mis datos se guardan automáticamente?

**Sí.** Cada vez que registras una venta o gasto, se guarda automáticamente en el navegador. El sistema usa IndexedDB (más confiable) con respaldo en localStorage. Verás un indicador verde si todo funciona correctamente.

### ¿Qué pasa si cierro el navegador?

Tus datos siguen guardados. Cuando vuelvas a abrir el archivo `index.html`, todos tus datos seguirán ahí. El sistema guarda en dos lugares diferentes para mayor confiabilidad.

### ¿Mis datos están seguros?

Tus datos se guardan **localmente en tu dispositivo** usando IndexedDB y localStorage. Esto significa:
- ✅ Solo tú tienes acceso a tus datos
- ✅ No se envían a ningún servidor
- ✅ No se comparten con nadie
- ⚠️ Si borras el historial del navegador, podrías perder los datos (por eso es importante hacer respaldos)

### ¿Funciona en teléfonos móviles?

**¡Sí, ahora funciona perfectamente!** El sistema está completamente optimizado para móviles:
- Diseño responsive que se adapta a pantallas pequeñas
- IndexedDB funciona mejor que localStorage en móviles
- Puedes agregarlo a tu pantalla de inicio como una app
- Funciona en Android (Chrome) y iPhone/iPad (Safari)

**Si en tu teléfono no guarda datos:**
1. Verifica que NO estés en modo incógnito
2. Asegúrate de usar Chrome (Android) o Safari (iPhone)
3. Revisa el indicador de estado en la parte superior
4. Haz respaldos frecuentes con "Exportar Datos"

### ¿Puedo usar esto en múltiples dispositivos?

**¡Sí!** Ahora puedes usar los mismos datos en todos tus dispositivos fácilmente:

1. **Exporta** los datos en el primer dispositivo (Dashboard → "📤 Exportar Datos")
2. **Transfiere** el archivo JSON al segundo dispositivo (WhatsApp, Google Drive, Email, etc.)
3. **Importa** los datos en el segundo dispositivo (Dashboard → "📥 Importar Datos")
4. **Elige** si quieres REEMPLAZAR (mismos datos) o COMBINAR (unir datos de ambos)

**💡 Recomendación:** 
- Haz respaldos frecuentes en cada dispositivo
- Usa la misma carpeta en Google Drive para tener acceso fácil desde todos tus dispositivos

### ¿Necesito internet para usar el sistema?

**¡NO!** Si instalas la app como PWA, funciona **completamente offline**:

- ✅ Puedes registrar ventas y gastos sin internet
- ✅ Puedes ver todos tus datos sin internet
- ✅ Puedes generar reportes sin internet
- ✅ Puedes exportar PDFs sin internet (una vez instalada)

**Primera vez:**
- Necesitas internet la primera vez para que la PWA se instale y descargue todos los archivos
- Después de instalar, todo funciona offline

**Si NO instalas la PWA:**
- Necesitas internet cada vez para cargar las librerías de gráficas
- Funciona pero es más lento

### ¿Qué significa el indicador de estado?

En la parte superior verás un indicador que muestra el estado del almacenamiento:

- **✅ Verde:** IndexedDB funcionando perfectamente, guardado confiable
- **⚠️ Amarillo:** Usando localStorage como respaldo, funciona pero menos óptimo
- **❌ Rojo:** Problemas con el almacenamiento, haz respaldos frecuentes

### ¿Qué hacer si veo el indicador rojo?

1. En móviles, verifica que NO estés en modo incógnito
2. Cierra y vuelve a abrir el navegador
3. Verifica los permisos de almacenamiento
4. Haz un respaldo inmediato con "Exportar Datos"
5. Intenta hacer algunas operaciones para ver si funciona

### ¿Cómo actualizo el sistema si hay una nueva versión?

Simplemente reemplaza los archivos `index.html`, `estilos.css` y `app.js` con los nuevos. **IMPORTANTE:** Antes de reemplazar, exporta tus datos como respaldo por si acaso.

---

## 🎨 Características del Sistema

### ✅ Funcionalidades Implementadas

#### Funcionalidades Básicas
- ✅ Registro de ventas con todos los campos solicitados
- ✅ Registro de gastos por categorías
- ✅ Cálculo automático de saldos (día, semana, mes, total)
- ✅ Dashboard con resumen visual
- ✅ Tablas interactivas con todos los registros
- ✅ Filtros por fecha y categoría
- ✅ Reportes completos con gráficas
- ✅ Productos más vendidos
- ✅ Comparativa mensual
- ✅ Exportación a PDF

#### Sistema de Almacenamiento (NUEVO)
- ✅ IndexedDB como almacenamiento principal (más confiable en móviles)
- ✅ localStorage como respaldo automático
- ✅ Indicador visual de estado (verde/amarillo/rojo)
- ✅ Detección de modo incógnito y permisos bloqueados
- ✅ Mensajes de error claros si hay problemas

#### PWA - Progressive Web App (NUEVO)
- ✅ Instalable como app nativa en Android, iPhone y computadora
- ✅ Funciona completamente offline (sin internet)
- ✅ Service Worker para cachear todos los archivos
- ✅ Banner de instalación automático
- ✅ Iconos personalizados para la app
- ✅ Se abre en ventana propia (sin barra del navegador)
- ✅ Recordatorio automático de respaldos semanales

#### Respaldo y Sincronización Mejorados (NUEVO)
- ✅ Botones grandes y visibles de Exportar/Importar en Dashboard
- ✅ Exportar con nombre con fecha: `contabilidad-backup-FECHA.json`
- ✅ Importar con opción de REEMPLAZAR o COMBINAR datos
- ✅ Validación de archivos JSON
- ✅ Prevención de duplicados al combinar
- ✅ Instrucciones claras sobre cómo compartir entre dispositivos

#### Respaldo y Administración (NUEVO)
- ✅ Sistema de respaldo (exportar/importar datos)
- ✅ Botón "Borrar Todos los Datos" con confirmación triple
- ✅ Validación de archivos JSON en importación
- ✅ Respaldo dual automático (IndexedDB + localStorage)

#### Interfaz y Experiencia (NUEVO)
- ✅ Validación de formularios
- ✅ Confirmaciones antes de eliminar
- ✅ Diseño responsive (funciona en móviles)
- ✅ Mensajes de confirmación
- ✅ Meta tags para PWA (agregar a pantalla de inicio)
- ✅ Compatible con navegadores antiguos

### 🎨 Diseño

- Colores profesionales (azul, verde, gris)
- Iconos claros para cada sección
- Diseño limpio y fácil de usar
- Botones grandes y claros
- Mensajes de confirmación visibles

---

## 🔧 Requisitos Técnicos

- **Navegador:** Cualquier navegador moderno (Chrome, Firefox, Edge, Safari)
- **Internet:** Solo necesario la primera vez para cargar librerías externas
- **Instalación:** No requiere instalación, solo abrir el archivo HTML

---

## 📞 Soporte y Solución de Problemas

### Problemas Comunes y Soluciones

#### 1. "No guarda datos en mi teléfono"

**Solución:**
- Verifica que NO estés en modo incógnito
- Usa Chrome en Android o Safari en iPhone
- Comprueba el indicador de estado en la parte superior
- Haz respaldos frecuentes con "Exportar Datos"

#### 2. "Veo el indicador rojo ❌"

**Solución:**
- En móviles, sal de modo incógnito
- Cierra y vuelve a abrir el navegador
- Verifica los permisos de almacenamiento
- Haz un respaldo inmediato con "Exportar Datos"

#### 3. "Perdí todos mis datos"

**Solución:**
- Si hiciste respaldos, usa "Importar Datos"
- Si compartes con otros dispositivos, exporta e importa
- Para evitar esto, haz respaldos semanales

#### 4. "Las gráficas no se ven"

**Solución:**
- Verifica que tengas conexión a internet
- Cierra y vuelve a abrir la pestaña "Reportes"
- Intenta en otro navegador

#### 5. "No puedo abrir el archivo en mi teléfono"

**Solución:**
- En Android: Usa un administrador de archivos (Google Files)
- En iPhone: Usa el app "Archivos" de Apple
- Asegúrate de tener todos los archivos juntos

#### 6. "Al copiar los archivos, no funciona"

**Solución:**
- Copia TODA la carpeta, no solo algunos archivos
- Mantén juntos: index.html, app.js, estilos.css
- En móviles, no los separes en subcarpetas

### Contacto para Soporte

Si encuentras algún problema o tienes preguntas:

1. **Verifica que tengas todos los archivos** en la misma carpeta
2. **Abre el archivo en un navegador moderno** (Chrome o Firefox recomendados)
3. **Revisa que tengas internet** la primera vez que abres el sistema
4. **Verifica la consola del navegador** (F12) si hay errores
5. **Lee las preguntas frecuentes** en la sección anterior

---

## 📝 Notas Importantes

1. **Haz respaldos regularmente:** Aunque los datos se guardan automáticamente, siempre es bueno tener un respaldo extra.

2. **No borres el historial del navegador sin exportar:** Si borras el historial/cache del navegador, podrías perder tus datos. Siempre exporta antes de limpiar.

3. **Usa categorías consistentes:** Para obtener mejores reportes, intenta usar las mismas categorías y descripciones similares.

4. **Fechas importantes:** El sistema usa la fecha que seleccionas, no la fecha actual automáticamente. Esto te permite registrar transacciones pasadas si olvidaste hacerlo en su momento.

---

## 🎉 ¡Listo para Empezar!

Ahora ya sabes todo lo necesario para usar el sistema. Solo sigue estos pasos:

1. ✅ Abre el archivo `index.html` en tu navegador
2. ✅ Ve a la pestaña "Ventas" y registra tu primera venta
3. ✅ Ve a la pestaña "Gastos" y registra tu primer gasto
4. ✅ Revisa el Dashboard para ver tus saldos
5. ✅ Genera tu primer reporte en la pestaña "Reportes"
6. ✅ Haz un respaldo de tus datos

**¡Éxito con tu negocio!** 🚀

