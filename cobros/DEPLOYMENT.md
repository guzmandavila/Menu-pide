# Cobros reales — 22 de septiembre de 2026

- Menú: https://guzmandavila.github.io/Menu-pide/
- Panel: https://guzmandavila.github.io/clowder-cobros/
- Repositorio del panel: https://github.com/guzmandavila/clowder-cobros
- Servicio: https://clowder-cobros.rnnld.chatgpt.site
- Site: `appgprj_6ab2dff4cb2481918b36a803dfee73a9`
- Versión del servicio: `appgprj_6ab2dff4cb2481918b36a803dfee73a9~appgver_bc7618dadaf4819182474ce63ef1edb5`
- Despliegue: `appgdep_6ab323b4fb9c8191b7bac510ed9f66f6`
- Fuente del servicio: `ab81fba17fe383a20dfb82beab77603a22d43da4`

## Operación

Los nuevos pedidos se guardan antes de abrir WhatsApp; el administrador verifica pedido y pago antes de confirmar el cobro. No se envían mensajes automáticamente. El efectivo se muestra separado, nunca en el pendiente para Fernanda. Un cancelado no cuenta y, si se cobró, muestra devolución pendiente. Las entregas registradas reducen el pendiente. Anular una entrega errónea restaura el pendiente sin borrar el historial.

Los cobros anteriores a la activación no aparecen automáticamente. Para ventas de hoy anteriores o tomadas fuera del menú usar «Registrar un cobro de hoy fuera del menú», verificando que no esté ya registrado. Ese formulario requiere clave y registra un pago confirmado con fecha actual de Ecuador; no genera una transferencia bancaria.

El servicio admite solicitudes sin ChatGPT para que funcione con los clientes del menú. Leer datos y realizar operaciones administrativas siempre requiere la clave privada. CORS permite el origen de GitHub, las solicitudes públicas están limitadas y las modificaciones quedan auditadas. CORS no sustituye la autenticación. La clave no está en ningún repositorio. Cambiar el secreto del servicio y desplegar una nueva versión revoca la clave anterior.

## Fuentes

- `../clowder-cobros-site/`: checkout independiente de Sites, Worker y migraciones D1. Reutilizar su `.openai/hosting.json` y el flujo de apertura/publicación de Sites.
- `../clowder-cobros-github/`: checkout del panel GitHub Pages. Copiar solo HTML, CSS, JS públicos y fuente; usar rutas relativas para `/clowder-cobros/` y conservar CSP. Nunca copiar bases de datos, claves o `.sites-runtime`.
- El menú público usa `menu-config.json` para la URL del servicio.
- `server.py` sigue como prototipo local y no atiende producción.

Para recuperar datos se debe usar el servicio y su base D1; GitHub solo conserva código. La prueba de activación conserva una instantánea administrativa anterior en el directorio privado local `.sites-runtime`; no sustituye un respaldo completo de D1.

## Verificación

`check.mjs` en el checkout del servicio comprueba autenticación, idempotencia, estados, auditoría, cobro manual y límites. `scripts/check-cobros-live.mjs` comprueba las URLs publicadas mediante credenciales suministradas solo por stdin. Intercepta WhatsApp, registra exclusivamente pedidos identificados como pruebas y al terminar cancela esos pedidos y anula su entrega. Los datos reales existentes se conservan.

La versión del menú ya abierta en un teléfono puede necesitar recargarse para recibir el código nuevo.

## Activación verificada

2026-09-22 20:01 -05: prueba completada desde el menú y el panel públicos de GitHub, sin sesión de ChatGPT. Se verificaron cobros bancarios, efectivo, entrega, cancelación, devolución, entrada manual de cobro y pantalla móvil. Se conservaron los registros previos del usuario; los registros técnicos añadidos se cancelaron y su entrega se anuló.
