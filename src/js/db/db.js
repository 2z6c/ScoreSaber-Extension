/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
export const promisify = request => new Promise( (resolve,reject) => {
  /**
   * @param {Event & {target:{result:T}}} e
   */
  const onSuccess = e=>{
    resolve( e.target.result );
  };
  request.addEventListener('success',onSuccess);
  request.addEventListener('error', e=>{
    reject(e);
  });
});