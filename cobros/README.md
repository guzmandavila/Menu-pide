> **Producción:** el panel ya está en GitHub y usa el servicio Sites/D1. Ver [DEPLOYMENT.md](DEPLOYMENT.md). El documento siguiente describe el prototipo Python local.

# Cobros vinculados al menú

Implementación preparada para conectar el menú de GitHub Pages a un servicio privado de administración. **No está activada en producción:** `ordersApiUrl` está vacío. Mientras esté vacío, los pedidos siguen abriendo WhatsApp sin guardarse en el servicio. Los pedidos anteriores no se importan automáticamente.

## Qué registra

Al abrir WhatsApp desde el menú se guarda un pedido **pendiente**, con código, nombre, detalle, total y banco receptor. Abrir WhatsApp no demuestra que el mensaje fue enviado ni que hubo un pago. El administrador confirma ambos en el panel y comprueba el monto y la cuenta de destino. El total enviado por el cliente se considera una propuesta hasta esa confirmación.

- Los cobros confirmados se suman por cuenta y por fecha de cobro, en hora de Ecuador.
- El efectivo se muestra separado y nunca entra en el pendiente para Fernanda.
- Pendiente = cobros bancarios confirmados de pedidos vigentes − entregas registradas, desde que comenzó el registro.
- Cancelar conserva el historial y excluye el pedido del cierre, incluso si se cobró otro día. Por ello consultar una fecha pasada muestra sus cobros aún vigentes, no una fotografía histórica de ese cierre.
- Un pedido cobrado y cancelado genera una devolución pendiente; ese dinero se reserva para el cliente, no para Fernanda. Confirmar la devolución no vuelve a descontarlo.
- Una entrega puede salir de cualquier cuenta personal, aunque los cobros se recibieran en otros bancos. Se registra el dinero recibido por Fernanda, sin comisión.
- Un saldo negativo significa que se entregó más que el total vigente; puede aparecer al cancelar después de liquidar.
- Los reintentos idénticos no duplican pedidos, cobros, cancelaciones o entregas. Un pedido ya registrado no puede ser modificado por el cliente; debe empezar uno nuevo y avisar para cancelar el anterior.

Esta versión registra pagos completos (no abonos ni pagos mixtos), devoluciones completas y entregas realizadas en el momento de registrarlas. No conecta con bancos, envía mensajes, transfiere dinero ni verifica comprobantes. No permite editar entregas ya registradas: verificar monto y referencia antes de confirmar. El efectivo cobrado no es la ganancia neta.

## Ejecutar en local

Python 3.9 o posterior; sin librerías adicionales. Generar una clave de administrador de al menos 32 caracteres aleatorios, guardarla en un gestor de contraseñas y suministrarla como variable de entorno. Nunca escribirla en archivos públicos ni en `menu-config.json`.

```sh
export CLOWDER_ADMIN_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
export CLOWDER_DB="/ruta/privada/clowder.sqlite3"
export CLOWDER_ORIGINS="http://localhost:8080"
python3 cobros/server.py
```

Abrir `http://127.0.0.1:8787` e introducir esa clave. No se guarda en localStorage ni en cookies; salir o recargar requiere volver a introducirla. Para probar el menú, servir la raíz del proyecto por HTTP y configurar temporalmente `ordersApiUrl` como `http://127.0.0.1:8787`. No publicar esa dirección local.

## Activación real pendiente

Se necesita un alojamiento con proceso Python persistente, disco persistente, HTTPS y copias de seguridad. GitHub Pages no ejecuta este servicio. No debe usarse un disco efímero ni múltiples réplicas independientes con SQLite.

1. Alojar la carpeta `cobros` como servicio con un único proceso detrás de un proxy HTTPS. El servidor se vincula por defecto a `127.0.0.1:8787`; se pueden configurar `HOST` y `PORT` según el alojamiento.
2. Guardar `CLOWDER_ADMIN_TOKEN` en los secretos del alojamiento y `CLOWDER_DB` en el volumen persistente privado. Fijar permisos restrictivos a la carpeta de datos.
3. Configurar `CLOWDER_ORIGINS=https://guzmandavila.github.io` (origen sin `/Menu-pide/`). Es una lista separada por comas si se añaden dominios.
4. Configurar límites de solicitudes y conexiones en el proxy para `/api/orders` (es público para los clientes) y los endpoints privados. Los pedidos públicos nunca se contabilizan sin confirmación administrativa. El servidor limita cada cuerpo a 32 KB; el proxy debe limitar también frecuencia y conexiones.
5. Configurar copias periódicas consistentes con la API de backup de SQLite o `.backup`, guardadas fuera del volumen principal; probar restauración. No copiar solo el archivo principal mientras hay escrituras WAL.
6. Comprobar acceso privado, pedido de prueba, confirmación, cancelación, entrega y reinicio conservando datos. Borrar la base de prueba antes de usar cobros reales.
7. Poner la URL HTTPS del servicio, sin `/api`, en `ordersApiUrl` de `menu-config.json`; publicar el menú y verificar desde un teléfono. Compartir la clave privada únicamente con quienes administrarán cobros.

El servidor solo expone los archivos del panel y las rutas explícitas de API; no sirve la base de datos ni los archivos de configuración. Los cambios financieros requieren la clave. Conservar también la tabla `audit` para revisar operaciones. Cambiar el secreto reiniciando el servicio revoca el acceso con la clave anterior.

## Comprobaciones

```sh
python3 -m unittest discover -s cobros -p 'test_*.py'
node scripts/check-ledger.cjs
node scripts/check-cobros.cjs
node scripts/check-menu.cjs
node scripts/check-service-worker.cjs
```

La prueba integrada usa una base temporal, un servidor local, Chrome y Playwright. No envía mensajes ni toca pedidos reales.

## Publicación de prueba disponible

Hay una versión privada alojada, con servicio persistente, menú y panel conectados. Ver [DEPLOYMENT.md](DEPLOYMENT.md) para las URLs, el checkout alojado y la diferencia con este prototipo Python. El menú público de GitHub aún no está conectado al servicio.
