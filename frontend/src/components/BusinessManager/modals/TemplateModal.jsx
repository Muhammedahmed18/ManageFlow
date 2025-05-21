import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown, ChevronUp, Check, Type, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CURRENCY_SYMBOLS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

const TemplateModal = ({
  businessId,
  selectedTemplate,
  setSelectedTemplate,
  setShowAddForm,
  colors,
  isSaving,
  setIsSaving,
  onCreateTemplate,
  onUpdateTemplate
}) => {
  const isEdit = !!selectedTemplate;
  const [template, setTemplate] = useState({
    name: '',
    status: 'draft',
    business: parseInt(businessId),
    fields: []
  });
  const [showAddField, setShowAddField] = useState(false);
  const [currentField, setCurrentField] = useState({
    label: '',
    type: 'text',
    required: false,
    options: [],
    currency_symbol: '$',
    decimal_places: 2
  });
  const [expandedFields, setExpandedFields] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && selectedTemplate) {
      setTemplate({
        ...selectedTemplate,
        business: businessId
      });
      const expanded = {};
      selectedTemplate.fields.forEach((_, index) => {
        expanded[index] = false;
      });
      setExpandedFields(expanded);
    }
  }, [selectedTemplate, businessId, isEdit]);

  const showLockedToast = () => {
    toast.error("Currency settings cannot be changed after creation. Please delete and recreate the field.", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const toggleStatus = () => {
    setTemplate({
      ...template,
      status: template.status === 'active' ? 'draft' : 'active'
    });
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setTemplate({
      ...template,
      [name]: value
    });
  };

  const addField = () => {
    if (!currentField.label) {
      setErrors({...errors, ['fields.new.label']: 'Field label is required'});
      return;
    }

    const newField = {
      ...currentField,
    };
    
    if (newField.type !== 'dropdown') {
      newField.options = [];
    }
    if (newField.type !== 'currency') {
      delete newField.currency_symbol;
      delete newField.decimal_places;
    }
    
    setTemplate({
      ...template,
      fields: [...template.fields, newField]
    });
    
    setCurrentField({
      label: '',
      type: 'text',
      required: false,
      options: [],
      currency_symbol: '$',
      decimal_places: 2
    });
    setShowAddField(false);
    setErrors({...errors, ['fields.new.label']: undefined});
  };

  const removeFieldFromTemplate = (index) => {
    const updatedFields = [...template.fields];
    updatedFields.splice(index, 1);
    
    setTemplate({
      ...template,
      fields: updatedFields
    });
    
    const newExpanded = {...expandedFields};
    delete newExpanded[index];
    setExpandedFields(newExpanded);
  };

  const toggleFieldExpansion = (index) => {
    setExpandedFields({
      ...expandedFields,
      [index]: !expandedFields[index]
    });
  };

  const handleFieldOptionChange = (fieldIndex, optionIndex, value) => {
    const updatedFields = [...template.fields];
    updatedFields[fieldIndex].options[optionIndex].value = value;
    setTemplate({
      ...template,
      fields: updatedFields
    });
  };

  const addOptionToField = (fieldIndex) => {
    const updatedFields = [...template.fields];
    if (!updatedFields[fieldIndex].options) {
      updatedFields[fieldIndex].options = [];
    }
    
    updatedFields[fieldIndex].options.push({
      value: `Option ${updatedFields[fieldIndex].options.length + 1}`
    });
    
    setTemplate({
      ...template,
      fields: updatedFields
    });
  };

  const removeOptionFromField = (fieldIndex, optionIndex) => {
    const updatedFields = [...template.fields];
    updatedFields[fieldIndex].options.splice(optionIndex, 1);
    
    setTemplate({
      ...template,
      fields: updatedFields
    });
  };

  const handleCurrencyConfigChange = (fieldIndex, key, value) => {
    const updatedFields = [...template.fields];
    updatedFields[fieldIndex][key] = value;
    setTemplate({
      ...template,
      fields: updatedFields
    });
  };

  const validateTemplate = () => {
    const newErrors = {};
    if (!template.name) newErrors.name = 'Template name is required';
    if (!template.business) newErrors.business = 'Business is required';
    
    template.fields.forEach((field, index) => {
      if (!field.label) newErrors[`fields.${index}.label`] = 'Field label is required';
      if (field.type === 'dropdown' && (!field.options || field.options.length === 0)) {
        newErrors[`fields.${index}.options`] = 'Dropdown must have at least one option';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
  if (!validateTemplate()) return;

  setIsSaving(true);
  try {
    const templateData = {
      ...template,
      business: parseInt(businessId),
      fields: template.fields.map(field => {
        const formatted = {
          label: field.label,
          type: field.type,
          required: field.required || false,
          order: field.order || 0
        };

        // ✅ Only include `id` if it's a real number (from backend)
        if (Number.isInteger(field.id)) {
          formatted.id = field.id;
        }

        if (field.type === 'dropdown') {
          formatted.options = field.options?.filter(opt => opt.value?.trim()) || [];
        }

        if (field.type === 'currency') {
          formatted.currency_symbol = field.currency_symbol || '$';
          formatted.decimal_places = typeof field.decimal_places === 'number' ? field.decimal_places : 2;
        }

        return formatted;
      })
    };

    if (isEdit) {
      await onUpdateTemplate(templateData);
    } else {
      await onCreateTemplate(templateData);
    }
  } catch (error) {
    console.error("Error saving template:", error);
    if (error.response?.data) {
      console.log("Backend validation errors:", error.response.data);
      setErrors(error.response.data);
    }
  } finally {
    setIsSaving(false);
  }
};


  const handleClose = () => {
    setShowAddForm(false);
    setSelectedTemplate(null);
  };

  const fieldTypeIcons = {
    text: <Type size={16} className="mr-1" />,
    textarea: <Type size={16} className="mr-1" />,
    number: <span className="mr-1">#</span>,
    currency: <span className="mr-1">$</span>,
    dropdown: <ChevronDown size={16} className="mr-1" />,
    boolean: <Check size={16} className="mr-1" />,
    date: <CalendarIcon size={16} className="mr-1" />
  };

  const renderCurrencyInput = (value, onChange) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        {CURRENCY_SYMBOLS.map((currency) => (
          <option key={currency.code} value={currency.symbol}>
            {currency.code} - {currency.symbol} ({currency.name})
          </option>
        ))}
        <option value="custom">Custom symbol...</option>
      </select>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      {/* Toast container needs to be included somewhere in your app */}
      {/* This is typically placed in your root component (App.js) */}
      {/* I've included it here for completeness, but you might already have it elsewhere */}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
            {isEdit ? `Edit Template: ${template.name}` : "Create New Template"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: colors.textDark }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Template Name *
              </label>
              <input
                type="text"
                name="name"
                value={template.name}
                onChange={handleTemplateChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter a descriptive name"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                Status
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center">
                  <span className={`inline-flex items-center mr-3 ${template.status === 'active' ? 'text-green-700' : 'text-amber-700'}`}>
                    <span className={`mr-2 w-2.5 h-2.5 rounded-full ${template.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className="font-medium text-sm capitalize">{template.status}</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {template.status === 'active' ? 'Published' : 'Not published'}
                  </span>
                </div>
                <button
                  onClick={toggleStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${template.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${template.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {template.fields?.map((field, index) => (
              <div key={field.id || index} className="p-4 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {fieldTypeIcons[field.type] || fieldTypeIcons.text}
                      <span className="font-medium" style={{ color: colors.textDark }}>
                        {field.label}
                      </span>
                    </div>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: colors.secondary, color: colors.primary }}>
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => toggleFieldExpansion(index)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      {expandedFields[index] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => removeFieldFromTemplate(index)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedFields[index] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        {field.type === 'dropdown' && (
                          <>
                            <h4 className="text-sm font-medium">Dropdown Options</h4>
                            {field.options?.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt.value}
                                  onChange={(e) => handleFieldOptionChange(index, optIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border rounded"
                                />
                                <button
                                  onClick={() => removeOptionFromField(index, optIndex)}
                                  className="p-1 rounded-full hover:bg-red-50 text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addOptionToField(index)}
                              className="px-3 py-1.5 text-sm rounded-lg font-medium text-white"
                              style={{ backgroundColor: colors.primary }}
                            >
                              + Add Option
                            </button>
                          </>
                        )}

                        {field.type === 'currency' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Currency Symbol</label>
                              {field.id ? (
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border rounded">
                                  <div className="flex items-center">
                                    <Lock size={16} className="text-gray-500 mr-2" />
                                    <span className="font-medium">{field.currency_symbol}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={showLockedToast}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={field.currency_symbol || '$'}
                                  onChange={(e) => handleCurrencyConfigChange(index, 'currency_symbol', e.target.value)}
                                  className="w-full px-3 py-2 border rounded"
                                >
                                  {CURRENCY_SYMBOLS.map((currency) => (
                                    <option key={currency.code} value={currency.symbol}>
                                      {currency.code} - {currency.symbol} ({currency.name})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Decimal Places</label>
                              {field.id ? (
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border rounded">
                                  <div className="flex items-center">
                                    <Lock size={16} className="text-gray-500 mr-2" />
                                    <span className="font-medium">{field.decimal_places}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={showLockedToast}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={field.decimal_places || 2}
                                  onChange={(e) => handleCurrencyConfigChange(index, 'decimal_places', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border rounded"
                                >
                                  <option value={0}>0 (Whole numbers)</option>
                                  <option value={1}>1 decimal</option>
                                  <option value={2}>2 decimals</option>
                                  <option value={3}>3 decimals</option>
                                </select>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={field.required || false}
                            onChange={(e) => {
                              const updatedFields = [...template.fields];
                              updatedFields[index].required = e.target.checked;
                              setTemplate({...template, fields: updatedFields});
                            }}
                            className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-700">
                            Required field
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t pt-6">
            <button
              onClick={() => setShowAddField(!showAddField)}
              className="px-5 py-2.5 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              {showAddField ? 'Cancel' : '+ Add Field'}
            </button>
            
            {showAddField && (
              <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Add New Field</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Field Label *</label>
                    <input
                      type="text"
                      value={currentField.label}
                      onChange={(e) => setCurrentField({...currentField, label: e.target.value})}
                      className={`w-full px-3 py-2 border ${errors['fields.new.label'] ? 'border-red-500' : 'border-gray-200'} rounded`}
                      placeholder="e.g. Product Description"
                    />
                    {errors['fields.new.label'] && <p className="mt-1 text-sm text-red-600">{errors['fields.new.label']}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Field Type *</label>
                    <select
                      value={currentField.type}
                      onChange={(e) => setCurrentField({...currentField, type: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="boolean">Boolean (Yes/No)</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </div>

                {currentField.type === 'currency' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Currency Symbol</label>
                      {renderCurrencyInput(
                        currentField.currency_symbol,
                        (value) => setCurrentField({...currentField, currency_symbol: value})
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Decimal Places</label>
                      <select
                        value={currentField.decimal_places}
                        onChange={(e) => setCurrentField({...currentField, decimal_places: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value={0}>0 (Whole numbers)</option>
                        <option value={1}>1 decimal</option>
                        <option value={2}>2 decimals</option>
                        <option value={3}>3 decimals</option>
                      </select>
                    </div>
                  </div>
                )}

                {currentField.type === 'dropdown' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Default Options</label>
                    {currentField.options?.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => {
                            const newOptions = [...currentField.options];
                            newOptions[index].value = e.target.value;
                            setCurrentField({...currentField, options: newOptions});
                          }}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                        <button
                          onClick={() => {
                            const newOptions = [...currentField.options];
                            newOptions.splice(index, 1);
                            setCurrentField({...currentField, options: newOptions});
                          }}
                          className="p-1 rounded-full hover:bg-red-50 text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentField({
                        ...currentField,
                        options: [...currentField.options, {value: `Option ${currentField.options.length + 1}`}]
                      })}
                      className="mt-2 px-3 py-1.5 text-sm rounded-lg font-medium text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="required-field"
                    checked={currentField.required}
                    onChange={(e) => setCurrentField({...currentField, required: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="required-field" className="ml-2 block text-sm text-gray-700">
                    Required field
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={addField}
                    disabled={!currentField.label || !currentField.type}
                    className={`px-5 py-2 rounded-lg text-white font-medium ${
                      !currentField.label || !currentField.type ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ backgroundColor: colors.primary }}
                  >
                    Add Field
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving || !template.name}
            className={`px-5 py-2.5 rounded-lg text-white font-medium ${
              isSaving || !template.name ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: colors.primary }}
          >
            {isSaving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default TemplateModal;