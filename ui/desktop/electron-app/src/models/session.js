const treeKill = require('tree-kill');
const sanitizer = require('../utils/sanitizer.js');
const { isWindows } = require('../helpers/platform.js');
const { spawnAsyncJSONPromise } = require('../helpers/spawn-promise.js');
const { dialog } = require('electron')
const { spawn, spawnSync } = require('child_process');


class Session {
  #id;
  #addr;
  #token;
  #hostId;
  #process;
  #targetId;
  #proxyDetails;
  #username;
  #password;

  /**
   * Initialize a session to a controller address
   * using target details.
   * @param {string} addr
   * @param {string} targetId
   * @param {string} token
   * @param {string} hostId
   */
  constructor(addr, targetId, token, hostId) {
    this.#addr = addr;
    this.#targetId = targetId;
    this.#token = token;
    this.#hostId = hostId;
  }

  /**
   * Session id
   * @return {string}
   */
  get id() {
    return this.#id;
  }

  /**
   * @return {boolean}
   */
  get isRunning() {
    return this.#process && !this.#process.killed;
  }

  /**
   * Using cli, initialize a session to a target.
   * Tracks local proxy details if successful.
   */
  start() {
    const command = this.cliCommand();
    return spawnAsyncJSONPromise(command).then((spawnedSession) => {
      this.#process = spawnedSession.childProcess;
      this.#proxyDetails = spawnedSession.response;
      this.#process = spawnedSession.childProcess;
      this.#id = this.#proxyDetails.session_id;
      this.#username = this.#proxyDetails.credentials[0].secret.decoded.username;
      this.#password = this.#proxyDetails.credentials[0].secret.decoded.password;
      delete this.#proxyDetails.credentials;

      spawnSync('cmdkey', [
        '/generic:' + this.#proxyDetails.address,
        '/user:' + this.#username,
        '/pass:' + this.#password]);

      spawn('mstsc',[
        '/v:' + this.#proxyDetails.address + ':' + this.#proxyDetails.port,
        '/admin']);

      spawnSync('cmdkey ',[
        '/delete:' + this.#proxyDetails.address ,
        '/admin']);

      return this.#proxyDetails;
    });
  }

  objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, p)) {
            str += p + '::' + obj[p] + '\n';
        }
    }
    return str;
}

  /**
   * Stop proxy process used by session.
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        this.#process.on('close', () => resolve());
        this.#process.on('error', (e) => reject(e));
        /**
         * On Windows OS, a spawned process uses cmd.exe to initiate a session.
         * Hence, captured process.pid corresponds to cmd.exe instead of session.
         * To avoid orphaned session processes and due to lack of node support
         * to handle killing processes cleanly in this scenario,
         * kill entire dependent process tree on Windows.
         */
        isWindows() ? treeKill(this.#process.pid) : this.#process.kill();
      } else {
        // Do nothing when process isn't running
        resolve();
      }
    });
  }

  /**
   * Generate cli command for session.
   * @returns {[]}
   */
  cliCommand() {
    const sanitized = {
      target_id: sanitizer.base62EscapeAndValidate(this.#targetId),
      token: sanitizer.base62EscapeAndValidate(this.#token),
      addr: sanitizer.urlValidate(this.#addr),
    };

    const command = [
      'connect',
      `-target-id=${sanitized.target_id}`,
      `-token=${sanitized.token}`,
      `-addr=${sanitized.addr}`,
      '-format=json',
    ];

    if (this.#hostId) {
      sanitized.host_id = sanitizer.base62EscapeAndValidate(this.#hostId);
      command.push(`-host-id=${sanitized.host_id}`);
    }
    return command;
  }
}

module.exports = Session;
