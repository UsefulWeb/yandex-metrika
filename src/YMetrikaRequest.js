'use strict';

const https = require( 'https' ),
  qs = require( 'qs' ),
  apiUrl = 'api-metrika.yandex.ru';

let _clientsCount = new WeakMap;
/**
 * Класс связи с Яндекс.Метрикой
 */
class YMetrikaRequest {
  /**
   * Конструктор класса
   * @param  {String} token Токен доступа
   * @return {undefined}
   */
  constructor( token ) {
    Object.defineProperty( this, 'token', {
      value: token
    });

    _clientsCount.set( this, 0 );
  }

  /**
   * Возвращает количество активных запосов
   * @return {Number} количество клиентов
   */
  get activeClientsCount() {
    return _clientsCount.get( this );
  }

  /**
   * Формирует GET-запрос
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  get( url, data = {}, headers = {}) {
    return this.request( url, 'GET', data, headers );
  }

  /**
   * Формирует POST-запрос
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  post( url, data = {}, headers = {}) {
    return this.request( url, 'POST', data, headers );
  }

  /**
   * Формирует PUT запрос
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  put( url, data = {}, headers = {}) {
    return this.request( url, 'PUT', data, headers );
  }

  /**
   * Формирует DELETE запрос
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  delete( url, data = {}, headers = {}) {
    return this.request( url, 'DELETE', data, headers );
  }
  /**
   * Формирует запрос на сервер yandex Метрики
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} method    Метод запроса (GET, POST, PUT, DELETE и т.д)
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  request( url, method = 'GET', data = {}, headers = {}) {
    const isGET = method === 'GET',
      clientsCount = this.activeClientsCount;
    let encodedData = JSON.stringify( data ),
      queryParams = {
        oauth_token: this.token
      };

    _clientsCount.set( this, clientsCount + 1 );
    data = Object.assign({}, data );
    headers = Object.assign({}, headers );

    if ( isGET ) {
      Object.assign( queryParams, data );
    } else {
      headers[ 'Content-Length' ] = Buffer.byteLength( encodedData );
    }

    url += '?' + qs.stringify( queryParams );

    return this.beginRequest()
    .then(() => {
      return this.makeRequest( url, method, encodedData, headers );
    })
    .then( data => {
      this.endRequest();
      return data;
    });
  }

  /**
   * Создаёт начало запроса
   * @return {Promise} Ожидание выполнения запроса ранее, если имеется
   */
  beginRequest() {
    const constructor = this.constructor,
      timeoutTime = constructor.REQUEST_TIMEOUT,
      intervalTime = constructor.WAIT_REQUEST_CHECK_INTERVAL,
      maxActiveClients = constructor.MAX_ACTIVE_CLIENTS;
    let waitTime = constructor.MAX_WAIT_REQUEST_TIMEOUT;

    return new Promise(( resolve, reject ) => {
      /**
       * Таймер проверки занятости запроса.
       * Для того, чтобы не перегружать систему, принято решение -
       * не более одного асинхронного запроса от домена
       * @return {undefined}
       */
      const timer = () => {
        const clientsCount = this.activeClientsCount;
        if ( clientsCount <= maxActiveClients ) {
          return resolve();
        }
        waitTime -= intervalTime;
        if ( waitTime > 0 ) {
          return setTimeout( timer, 100 );
        }

        _clientsCount.set( this, clientsCount - 1 );
        reject( new Error( `Истекло максимальное время ожидания запроса (${timeoutTime} ms.)` ));
      };
      timer();
    })
    .then(() => {
      const clientsCount = this.activeClientsCount;
      _clientsCount.set( this, clientsCount - 1 );
    });
  }

  /**
   * Функция окончания запроса.
   * Делает доступным совершение последующих запросов
   * @return {Promise} обещание
   */
  endRequest() {
    return new Promise( resolve => {
      const clientsCount = this.activeClientsCount;
      _clientsCount.set( this, clientsCount - 1 );
      resolve();
    });
  }

  /**
   * [makeRequest description]
   * @param  {String} url     Адрес запроса на сервере, начиная с /
   * @param  {Object} method    Метод запроса (GET, POST, PUT, DELETE и т.д)
   * @param  {Object} data    Данные для запроса (не включая token)
   * @param  {Object} headers Заголовки запроса
   * @return {Promise}         Обещание ответа
   */
  makeRequest( url, method = 'GET', data, headers = {}) {
    const isGET = method === 'GET';
    return new Promise(( resolve, reject ) => {
      /**
       * Перехватывает ответ сервера
       * @param  {Object} response объект-ответ
       * @return {undefined}
       */
      const responseHandler = response => {
        /**
         * Обработчик пакета данных
         * @param  {String} chunk пакет
         * @return {undefined}
         */
        const onResponseData = chunk => {
            data += chunk;
          },
          /**
           * Срабатывает при окончании ответа
           * @return {undefined}
           */
          onResponseEnd = () => {
            try {
              resolve( JSON.parse( data ));
            } catch ( e ) {
              reject( e );
            }
          };

        let data = '';
        response.on( 'data', onResponseData );
        response.on( 'end', onResponseEnd );
      };

      let req = https.request({
        hostname: apiUrl,
        port: 443,
        path: url,
        method: method,
        headers: headers
      }, responseHandler );
      if ( !isGET ) {
        req.write( data );
      }
      req.end();
      req.on( 'error', e => {
        reject( e );
      });
    });
  }
}

// максимальное количество одновременных подключений
YMetrikaRequest.MAX_ACTIVE_CLIENTS = 2;
// таймаут ожидания выполнения очереди запросов
YMetrikaRequest.MAX_WAIT_REQUEST_TIMEOUT = 1000 * 60;
// время повторной проверки на возможность выполнения запроса
YMetrikaRequest.WAIT_REQUEST_CHECK_INTERVAL = 100;

module.exports = YMetrikaRequest;
