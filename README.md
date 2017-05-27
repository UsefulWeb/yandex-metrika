# yandex-metrika
[![NPM](https://img.shields.io/npm/v/yandex-metrika.svg)](https://www.npmjs.com/package/yandex-metrika)
[![Code Climate](https://codeclimate.com/github/UsefulWeb/yandex-metrika/badges/gpa.svg)](https://codeclimate.com/github/UsefulWeb/yandex-metrika)

Библиотека для API Яндекс.Метрики 
Для работы с данной библиотекой вам необходимо иметь OAuth-токен приложения Яндекс.Метрики. 
Для того, чтобы создать приложение:
- перейдите [по этой ссылке](https://oauth.yandex.ru/client/new) и добавьте в правах пункт Яндекс.Метрика.
- Получите OAuth токен по инструкции, описанной [здесь](https://tech.yandex.ru/oauth/doc/dg/concepts/ya-oauth-intro-docpage/)

## Установка
```
npm install yandex-metrika
```
## Использование

```javascript
const YMetrikaRequest = require( 'yandex-metrika' ),
  oauth_token = 'OAuth токен',
  counterId = 3123123, // id счётчика
  api = new YMetrikaRequest( oauth_token );

/* 
  получить информацию о счтчике по id
  GET /management/v1/counter/{counterId}
*/
api.get( `/management/v1/counter/${counterId}` )
.then( data => {
  console.log( data );
});

// аналогично
api.request( `/management/v1/counter/${counterId}`, 'GET' )
.then( data => {
  console.log( data );
});

/* 
  Создать новую цель
  POST https://api-metrika.yandex.ru/management/v1/counter/{counterId}/goals
*/

api.post( `https://api-metrika.yandex.ru/management/v1/counter/${counterId}/goals`, {
  name: 'Пробыл на сайте N минут',
  type: 'action',
  conditions: [
    {
      type: "exact",
      url: "goal_slug"
    }
  ]
})
.then( data => {
  console.log( data );
});

```

## Описание методов

```javascript
/**
 * Формирует GET, POST, PUT, DELETE запросы соответственно
 * @param  {String} url     Адрес запроса на сервере, начиная с /
 * @param  {Object} data    Данные для запроса (не включая token)
 * @param  {Object} headers Заголовки запроса
 * @return {Promise}         Обещание ответа
 */
api.get( url, data = {}, headers = {})
api.post( url, data = {}, headers = {})
api.put( url, data = {}, headers = {})
api.delete( url, data = {}, headers = {})

// формирует свободный запрос
api.request( url, method = 'GET', data = {}, headers = {})
```

## Возможные ошибки

- После 2 запросов последующие могут не работать

## В планах

Сделать тесты
