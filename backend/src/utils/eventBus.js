const { EventEmitter } = require('events');

class PipelineEventBus extends EventEmitter { }

const eventBus = new PipelineEventBus();

// Named pipeline events
const EVENTS = {
    OCR_COMPLETED: 'OCR_COMPLETED',
    ENTITY_EXTRACTION_COMPLETED: 'ENTITY_EXTRACTION_COMPLETED',
    INTERACTION_ANALYZED: 'INTERACTION_ANALYZED',
    RISK_CALCULATED: 'RISK_CALCULATED',
    PIPELINE_FAILED: 'PIPELINE_FAILED',
};

module.exports = { eventBus, EVENTS };
