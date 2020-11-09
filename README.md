## Proyecto de servicios REST en node



Instalar paquetes así

``````
npm install
``````
## Variables de entorno

Esta sección describe las variables de entorno necesarias para que el *back-end* pueda funcionar correctamente, manteniendo la privacidad de credenciales.

Para el modo de desarrollo, el archivo *.env* debe crearse dentro de la raíz del proyecto.

| ENV             | POR DEFECTO                   | DESCRIPCIÓN                                 |
| --------------- | ----------------------------- | ------------------------------------------- |
| MONGO_URI       | mongodb://localhost:27017/ctc | URL de la conexión a la base de datos.      |
| PORT            | 3000                          | Puerto que el servidor escucha.             |
| SEED_TOKEN      | seed-token-node               |                                             |
| CADUCIDAD_TOKEN | 24 horas                      | Duración del token de acceso.               |
| DOMAIN          | http://localhost:3000         | Dominio de la aplicación                    |
| SANDBOX         | .sandbox                      | Directorio para almacenar imagenes cargadas |

