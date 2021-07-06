/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
export const promisify = request => new Promise( (resolve,reject) => {
  request.addEventListener('success',e=>{
    resolve( e.target.result );
  });
  request.addEventListener('error', e=>{
    reject();
  });
});