const Joi = require('joi');

// Lead validation schema
const leadSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).required(),
  source: Joi.string().valid('Facebook', 'Website', 'Referral', 'Email', 'Phone', 'Walk-in', 'Other').required(),
  priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium'),
  assigned_agent_id: Joi.number().integer().positive().optional(),
  notes: Joi.string().max(1000).optional()
});

// Agent validation schema
const agentSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).optional(),
  is_active: Joi.boolean().default(true),
  can_handle_facebook: Joi.boolean().default(false)
});

// Partial agent update schema (for status updates)
const agentPartialSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).optional(),
  is_active: Joi.boolean().optional(),
  can_handle_facebook: Joi.boolean().optional()
}).min(1); // At least one field must be provided

// Lead status update validation
const leadStatusSchema = Joi.object({
  status: Joi.string().valid('New', 'Contacted', 'Converted', 'Lost').required(),
  notes: Joi.string().max(1000).optional()
});

// Contact attempt validation
const contactAttemptSchema = Joi.object({
  notes: Joi.string().max(1000).optional(),
  successful: Joi.boolean().required()
});

// Lead reassignment validation
const reassignSchema = Joi.object({
  agent_id: Joi.number().integer().positive().required(),
  reason: Joi.string().max(500).optional()
});

// Validation middleware functions
function validateLead(req, res, next) {
  const { error } = leadSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

function validateAgent(req, res, next) {
  const { error } = agentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

function validateAgentPartial(req, res, next) {
  const { error } = agentPartialSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

function validateLeadStatus(req, res, next) {
  const { error } = leadStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

function validateContactAttempt(req, res, next) {
  const { error } = contactAttemptSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

function validateReassign(req, res, next) {
  const { error } = reassignSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
}

module.exports = {
  validateLead,
  validateAgent,
  validateAgentPartial,
  validateLeadStatus,
  validateContactAttempt,
  validateReassign,
  leadSchema,
  agentSchema,
  agentPartialSchema,
  leadStatusSchema,
  contactAttemptSchema,
  reassignSchema
};
