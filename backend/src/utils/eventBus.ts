import { EventEmitter } from 'events';

class BuildEventBus extends EventEmitter { }

export const buildBus = new BuildEventBus();
