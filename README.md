# Menú Clowder

Menú estático publicado en [GitHub Pages](https://guzmandavila.github.io/Menu-pide/). No requiere compilación.

## Cambiar el número, redes o pagos

Edita únicamente `menu-config.json` para estos datos:

- `whatsappNumber`: número internacional, entre comillas, sin `+`, espacios ni guiones. Por ejemplo, **0979864314 → `"593979864314"`**: se elimina el cero inicial y se añade `593`.
- `paymentsUrl`: enlace de pagos.
- `instagramUrl`: perfil de Instagram.
- `communityUrl`: invitación a la comunidad de WhatsApp.

Los enlaces deben empezar con `https://`. No copies el número dentro de `index.html`, `app.js` o `contact-config.js`: los botones y pedidos comparten esta configuración.

La versión actual revisa el contacto cada 60 segundos mientras está visible y tiene conexión; también al recuperar conexión, volver a la pestaña y antes de abrir WhatsApp. Actualiza el destino sin borrar el carrito ni recargar la página. Si no puede verificar el contacto al enviar, conserva el pedido y solicita reintentar.

Esto funciona en páginas que ya cargaron este código. Una página antigua que siga abierta con código previo puede necesitar una actualización para recibirlo; publicar en GitHub no reemplaza inmediatamente el código que ya está ejecutándose en todos los teléfonos.

## Dónde editar el resto

| Cambio | Archivo o referencia |
| --- | --- |
| Productos, precios, categorías, fotos y opciones | `MENU`, al principio de `app.js`. Mantén identificadores `id` únicos y estables. Revisa también los ajustes de productos que aparecen inmediatamente después del catálogo. |
| Ocultar productos o categorías | `HIDDEN_ITEM_IDS` y `HIDDEN_CATS` en `app.js`. |
| Disponibilidad y horarios | Busca `KITCHEN_HOURS_ITEM_IDS`, `FULL_MENU_ORDERING_ENABLED`, `ALWAYS_OPEN_CATS`, `ALWAYS_OPEN_GROUPS`, `isMenuOpenNow` e `isDeliveryAvailableNow` en `app.js`. Si cambias horarios, actualiza también los textos visibles en `index.html`. |
| Banners | `CAT_BANNERS` en `app.js` y archivos de `banners/`. |
| Colores, tamaños y apariencia | `styles.css`. |
| Estructura, textos y ventanas informativas | `index.html`. |
| Imágenes | `assets/`, `miniaturas/` y `banners/`; usa rutas relativas, sin `/` inicial, para GitHub Pages. |
| Actualización del contacto y caché | `contact-config.js` y `sw.js`. No hace falta modificarlos para cambiar el número. |

## Comprobar antes de publicar

Necesitas Node.js 18 o posterior. La prueba del menú requiere Playwright y Google Chrome; inicia su propio servidor local. Instala Playwright si falta con `npm install --no-save --package-lock=false playwright`. En otro entorno puedes indicar `PLAYWRIGHT_PATH` (módulo) y `CHROME_PATH` (ejecutable), o configurar `NODE_PATH` si tus módulos están instalados fuera del proyecto.

```sh
node --check app.js
node --check contact-config.js
node --check sw.js
node scripts/check-service-worker.cjs
node scripts/check-menu.cjs
git diff --check
```

Las pruebas cubren carrito, importes, horarios, configuración del contacto y caché. La prueba del menú intercepta WhatsApp y servicios externos: no envía pedidos reales. `MENU_TEST_BASE_URL` permite ejecutarla contra otro servidor; la configuración del contacto también se simula en esas pruebas, así que comprueba además el número publicado.

La extracción de imágenes base64 es opcional: `python3 scripts/extract-inline-images.py --check` muestra el ahorro posible en `index.html`; sin `--check` extrae los archivos y sustituye las referencias. Conserva los bytes originales y puede ejecutarse de nuevo sin duplicarlos.

## Publicar y verificar

Desde la rama `main`, revisa `git status --short` y `git diff`. Añade solo los archivos de tu cambio; para un cambio de contacto:

```sh
git add menu-config.json
git commit -m "Actualiza el contacto del menú"
git push origin main
```

Si cambias código o imágenes, incluye también esos archivos. Espera a que termine el despliegue de Pages en GitHub y verifica el [menú publicado](https://guzmandavila.github.io/Menu-pide/) y su [configuración publicada](https://guzmandavila.github.io/Menu-pide/menu-config.json). Comprueba los botones de contacto y el destino de un pedido de prueba sin enviarlo. Un `push` correcto por sí solo no confirma que Pages ya sirva la versión nueva.

## Registro de pedidos y cierre de cobros

El menú guarda cada pedido como pendiente al abrir WhatsApp. El cliente indica efectivo o el banco receptor. Confirma el cobro en https://guzmandavila.github.io/clowder-cobros/ para sumarlo al cierre.

El panel tiene su propio repositorio `guzmandavila/clowder-cobros`; las pantallas están en GitHub Pages y los datos en el servicio Sites/D1 configurado en `ordersApiUrl`. No se requiere iniciar sesión en ChatGPT. La clave administrativa se guarda solo como secreto del servicio, nunca en GitHub.

El pendiente para Fernanda excluye efectivo y cancelados. Las entregas reducen el pendiente acumulado. Los cobros de hoy previos a la activación y los pedidos tomados fuera del menú pueden registrarse desde el panel con «Registrar un cobro de hoy fuera del menú». No se importan cobros históricos automáticamente.

Más detalles de operación y publicación en [`cobros/DEPLOYMENT.md`](cobros/DEPLOYMENT.md). `cobros/server.py` es únicamente el prototipo local: el servicio de producción está en el checkout independiente `clowder-cobros-site`.
