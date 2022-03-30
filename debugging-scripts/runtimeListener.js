const EventEmitter = require('events');
class RuntimeEventEmitter extends EventEmitter { };
/**
 * Pub/Sub Module to listen to values as they happen  in runtime context
 * Can be used to extract values within a specific call context for testing / verifying outside of the runtime context
 */
class RuntimeListener {
    constructor() {
        this.emitter = new RuntimeEventEmitter();
    }
    listen(eventName, callback) {
        this.emitter.on(eventName, (eventArg) => {
            callback(eventArg);
        })
    }
    emit(eventName, eventParam) {
        this.emitter.emit(eventName, eventParam);
    }
}
module.exports = new RuntimeListener();