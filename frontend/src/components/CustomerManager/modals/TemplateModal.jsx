import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Type, 
  Lock, 
  Plus,
  Hash,
  DollarSign,
  List,
  ToggleLeft,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

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

// Mock props for demonstration
const mockProps = {
  businessId: '123',
  selectedTemplate: null,
  setSelectedTemplate: () => {},
  setShowAddForm: () => {},
  colors: {
    primary: '#3b82f6',
    secondary: '#e0f2fe',
    textDark: '#1f2937'
  },
  isSaving: false,
  setIsSaving: () => {},
  onCreateTemplate: async (data) => console.log('Create:', data),
  onUpdateTemplate: async (data, id) => console.log('Update:', data, id)
};

const TemplateModal = (props = mockProps) => {
  const {
    businessId,
    selectedTemplate,
    setSelectedTemplate,
    setShowAddForm,
    colors,
    isSaving,
    setIsSaving,
    onCreateTemplate,
    onUpdateTemplate
  } = props;

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
    decimal_places: 2,
    default_value: ''
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

  const showToast = (message, type = 'error') => {
    // Mock toast notification
    console.log(`${type}: ${message}`);
  };

  const showLockedToast = () => {
    showToast("Currency settings cannot be changed after creation. Please delete and recreate the field.", 'error');
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({...errors, [name]: undefined});
    }
  };

  const addField = () => {
    if (!currentField.label) {
      setErrors({...errors, 'fields.new.label': 'Field label is required'});
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
      decimal_places: 2,
      default_value: ''
    });
    setShowAddField(false);
    setErrors({...errors, 'fields.new.label': undefined});
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
      value: ''
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
    if (!template.name?.trim()) newErrors.name = 'Template name is required';
    if (!template.business) newErrors.business = 'Business is required';
    
    template.fields.forEach((field, index) => {
      if (!field.label?.trim()) newErrors[`fields.${index}.label`] = 'Field label is required';
      if (field.type === 'dropdown' && (!field.options || field.options.length === 0 || !field.options.some(opt => opt.value?.trim()))) {
        newErrors[`fields.${index}.options`] = 'Dropdown must have at least one non-empty option';
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
            label: field.label?.trim(),
            type: field.type,
            required: field.required || false,
            order: field.order || 0
          };

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

          if (field.type === 'default_value') {
            formatted.default_value = field.default_value || '';
          }

          return formatted;
        })
      };

      if (isEdit) {
        await onUpdateTemplate(templateData, template.id);
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
    text: <Type size={16} />,
    textarea: <FileText size={16} />,
    number: <Hash size={16} />,
    currency: <DollarSign size={16} />,
    dropdown: <List size={16} />,
    boolean: <ToggleLeft size={16} />,
    default_value: <Check size={16} />
  };

  const getFieldTypeLabel = (type) => {
    const labels = {
      text: 'Text',
      textarea: 'Text Area',
      number: 'Number',
      currency: 'Currency',
      dropdown: 'Dropdown',
      boolean: 'Boolean',
      default_value: 'Default Value'
    };
    return labels[type] || type;
  };

  const renderCurrencyInput = (value, onChange, disabled = false) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
        } focus:outline-none`}
      >
        {CURRENCY_SYMBOLS.map((currency) => (
          <option key={currency.code} value={currency.symbol}>
            {currency.code} - {currency.symbol} ({currency.name})
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Template' : 'Create New Template'}
              </h2>
              {isEdit && (
                <p className="text-sm text-gray-600 mt-1">{template.name}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <X size={20} className="text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-8">
            {/* Template Basic Info */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={template.name}
                    onChange={handleTemplateChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50'
                    } focus:ring-4 focus:outline-none`}
                    placeholder="Enter a descriptive template name..."
                    required
                  />
                  {errors.name && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle size={14} />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Status
                  </label>
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        template.status === 'active' ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-amber-500 shadow-amber-200 shadow-lg'
                      }`}></div>
                      <div>
                        <span className="font-semibold text-gray-900 capitalize text-sm">
                          {template.status}
                        </span>
                        <span className={`ml-2 text-xs px-3 py-1 rounded-full font-medium ${
                          template.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {template.status === 'active' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={toggleStatus}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${
                        template.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
                          template.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fields Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Template Fields</h3>
                <div className="text-sm text-gray-500">
                  {template.fields?.length || 0} field{(template.fields?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Existing Fields */}
              <div className="space-y-4">
                {template.fields?.map((field, index) => (
                  <div key={field.id || index} className="group border-2 border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all duration-200">
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600">
                            {fieldTypeIcons[field.type] || fieldTypeIcons.text}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{field.label}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                                {getFieldTypeLabel(field.type)}
                              </span>
                              {field.required && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-medium">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleFieldExpansion(index)} 
                            className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {expandedFields[index] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button 
                            onClick={() => removeFieldFromTemplate(index)} 
                            className="p-2.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Field Details */}
                      {expandedFields[index] && (
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                          {field.type === 'dropdown' && (
                            <div className="space-y-4">
                              <h5 className="font-semibold text-gray-900">Dropdown Options</h5>
                              <div className="space-y-3">
                                {field.options?.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={opt.value}
                                      onChange={(e) => handleFieldOptionChange(index, optIndex, e.target.value)}
                                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => removeOptionFromField(index, optIndex)}
                                      className="p-2.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addOptionToField(index)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                              >
                                <Plus size={16} />
                                Add Option
                              </button>
                            </div>
                          )}

                          {field.type === 'currency' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-900">Currency Symbol</label>
                                {field.id ? (
                                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-2 border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Lock size={16} className="text-gray-500" />
                                      <span className="font-semibold text-gray-700">{field.currency_symbol}</span>
                                      <span className="text-sm text-gray-500">(Locked)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={showLockedToast}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <AlertCircle size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  renderCurrencyInput(
                                    field.currency_symbol || '$',
                                    (value) => handleCurrencyConfigChange(index, 'currency_symbol', value)
                                  )
                                )}
                              </div>

                              <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-900">Decimal Places</label>
                                {field.id ? (
                                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-2 border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Lock size={16} className="text-gray-500" />
                                      <span className="font-semibold text-gray-700">{field.decimal_places}</span>
                                      <span className="text-sm text-gray-500">(Locked)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={showLockedToast}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <AlertCircle size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={field.decimal_places || 2}
                                    onChange={(e) => handleCurrencyConfigChange(index, 'decimal_places', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all"
                                  >
                                    <option value={0}>0 (Whole numbers)</option>
                                    <option value={1}>1 decimal place</option>
                                    <option value={2}>2 decimal places</option>
                                    <option value={3}>3 decimal places</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={field.required || false}
                              onChange={(e) => {
                                const updatedFields = [...template.fields];
                                updatedFields[index].required = e.target.checked;
                                setTemplate({...template, fields: updatedFields});
                              }}
                              className="h-5 w-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor={`required-${index}`} className="text-sm font-medium text-gray-700">
                              Required field
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Field */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setShowAddField(!showAddField)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Plus size={16} />
                  {showAddField ? 'Cancel' : 'Add Field'}
                </button>
                
                {showAddField && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900">Add New Field</h4>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentField.label}
                            onChange={(e) => setCurrentField({...currentField, label: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                              errors['fields.new.label'] 
                                ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                                : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                            } focus:outline-none`}
                            placeholder="Enter field name..."
                          />
                          {errors['fields.new.label'] && (
                            <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                              <AlertCircle size={12} />
                              <span>{errors['fields.new.label']}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                          <div className="relative">
                            <select
                              value={currentField.type}
                              onChange={(e) => setCurrentField({...currentField, type: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none appearance-none bg-white"
                            >
                              <option value="text">📝 Text</option>
                              <option value="textarea">📄 Text Area</option>
                              <option value="number"># Number</option>
                              <option value="currency">💰 Currency</option>
                              <option value="dropdown">📋 Dropdown</option>
                              <option value="boolean">✅ Boolean (Yes/No)</option>
                              <option value="default_value">🔒 Default Value</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Field Type Specific Options */}
                      {currentField.type === 'currency' && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h5 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                            <DollarSign size={16} />
                            Currency Settings
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                              {renderCurrencyInput(
                                currentField.currency_symbol,
                                (value) => setCurrentField({...currentField, currency_symbol: value})
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Places</label>
                              <select
                                value={currentField.decimal_places}
                                onChange={(e) => setCurrentField({...currentField, decimal_places: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white"
                              >
                                <option value={0}>0 (Whole numbers)</option>
                                <option value={1}>1 decimal place</option>
                                <option value={2}>2 decimal places</option>
                                <option value={3}>3 decimal places</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentField.type === 'dropdown' && (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h5 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                            <List size={16} />
                            Dropdown Options
                          </h5>
                          <div className="space-y-2">
                            {currentField.options?.map((opt, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                                  {index + 1}
                                </div>
                                <input
                                  type="text"
                                  value={opt.value}
                                  onChange={(e) => {
                                    const newOptions = [...(currentField.options || [])];
                                    newOptions[index].value = e.target.value;
                                    setCurrentField({...currentField, options: newOptions});
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                                  placeholder={`Option ${index + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const newOptions = [...(currentField.options || [])];
                                    newOptions.splice(index, 1);
                                    setCurrentField({...currentField, options: newOptions});
                                  }}
                                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentField({
                              ...currentField,
                              options: [...(currentField.options || []), {value: ''}]
                            })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                          >
                            <Plus size={14} />
                            Add Option
                          </button>
                        </div>
                      )}

                      {currentField.type === 'default_value' && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <h5 className="text-sm font-medium text-amber-900 mb-3 flex items-center gap-2">
                            <Check size={16} />
                            Default Value Settings
                          </h5>
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={currentField.default_value || ''}
                              onChange={(e) => setCurrentField({...currentField, default_value: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                              placeholder="e.g., Size M, 100% Cotton, 16x14..."
                            />
                            <p className="text-xs text-amber-800 flex items-start gap-1">
                              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                              This value will be pre-filled and locked when creating products
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <input
                          type="checkbox"
                          id="required-field"
                          checked={currentField.required}
                          onChange={(e) => setCurrentField({...currentField, required: e.target.checked})}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="required-field" className="text-sm font-medium text-gray-700">
                          Make this field required
                        </label>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        onClick={() => setShowAddField(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addField}
                        disabled={!currentField.label?.trim() || !currentField.type}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          !currentField.label?.trim() || !currentField.type 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Plus size={14} />
                        Add Field
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {template.fields?.length ? (
                `${template.fields.length} field${template.fields.length !== 1 ? 's' : ''} configured`
              ) : (
                'No fields added yet'
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !template.name?.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isSaving || !template.name?.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {isSaving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;