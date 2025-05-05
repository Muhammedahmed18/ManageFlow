import React, { useState, useEffect, useRef } from 'react';
import { X, Image, ChevronLeft, ChevronRight, ChevronDown, Check, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ProductModal = ({
  businessId,
  templates,
  categories,
  selectedProduct,
  setShowAddForm,
  onCreateProduct,
  onUpdateProduct,
  isSaving,
  setIsSaving,
  colors = {
    primary: '#3b82f6',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    border: '#e5e7eb',
    cream: '#f5f5f4',
    light: '#9ca3af',
    error: '#ef4444'
  }
}) => {
  const isEdit = !!selectedProduct;
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    custom_id: '',
    template_id: '',
    category_id: null,
    field_values: {},
    image: null,
    imagePreview: null
  });

  const [errors, setErrors] = useState({});
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [currentCategoryChildren, setCurrentCategoryChildren] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFields, setTemplateFields] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  // Initialize form
  useEffect(() => {
    const mainCategories = categories?.filter(c => !c?.parent) || [];
    setCurrentCategoryChildren(mainCategories);
  
    if (selectedProduct) {
      const initialFieldValues = {};
      const productFieldMap = {};
      const usedFieldIds = new Set();
  
      if (selectedProduct.field_values && Array.isArray(selectedProduct.field_values)) {
        selectedProduct.field_values.forEach(fv => {
          const fid = fv.field?.id?.toString() || fv.field_id?.toString();
          if (fid) {
            productFieldMap[fid] = {
              id: fv.field?.id || fv.field_id,
              label: fv.field?.label || '',
              type: fv.field?.type || 'text',
              required: fv.field?.required || false,
              options: fv.field?.options || []
            };
            initialFieldValues[fid] = fv.value;
            usedFieldIds.add(fid);
          }
        });
      }
  
      const tpl = templates.find(t => String(t.id) === String(selectedProduct.template?.id));
      if (tpl) {
        const mergedFields = [];
  
        tpl.fields.forEach(field => {
          const fid = field.id.toString();
          if (!usedFieldIds.has(fid)) {
            initialFieldValues[fid] = '';
          }
          mergedFields.push(field);
        });
  
        setSelectedTemplate(tpl);
        setTemplateFields(mergedFields);
      }
  
      setFormData({
        name: selectedProduct.name || '',
        custom_id: selectedProduct.custom_id || '',
        template_id: selectedProduct.template?.id || '',
        category_id: selectedProduct.category?.id || null,
        field_values: initialFieldValues,
        image: null,
        imagePreview: selectedProduct.image_url || (selectedProduct.image ? `${window.location.origin}${selectedProduct.image}` : null)
      });
      
      if (selectedProduct.category) {
        buildCategoryPath(selectedProduct.category.id);
      }
    } else {
      resetForm();
    }
  }, [selectedProduct, categories, templates]);

  // Reset form to default state
  const resetForm = () => {
    setFormData({
      name: '',
      custom_id: '',
      template_id: '',
      category_id: null,
      field_values: {},
      image: null,
      imagePreview: null
    });
    setSelectedCategoryPath([]);
    setCurrentCategoryChildren(categories?.filter(cat => !cat.parent) || []);
    setSelectedTemplate(null);
    setTemplateFields([]);
  };

  // Build category path hierarchy
  const buildCategoryPath = (categoryId) => {
    if (!categoryId) {
      setSelectedCategoryPath([]);
      setCurrentCategoryChildren(categories?.filter(c => !c?.parent) || []);
      return;
    }

    const path = [];
    let currentCategory = categories.find(c => c.id === categoryId);
    
    while (currentCategory) {
      path.unshift(currentCategory);
      currentCategory = currentCategory.parent ? 
        categories.find(c => c.id === currentCategory.parent) : null;
    }
    
    setSelectedCategoryPath(path);
    if (path.length > 0) {
      const lastCategory = path[path.length - 1];
      setCurrentCategoryChildren(
        categories.filter(cat => cat.parent === lastCategory.id)
      );
    } else {
      setCurrentCategoryChildren(categories?.filter(cat => !cat.parent) || []);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category_id: category.id }));
    buildCategoryPath(category.id);
    setErrors(prev => ({ ...prev, category: undefined }));
    setActiveAccordion(null);
  };

  // Handle category navigation
  const navigateToCategory = (index) => {
    const newPath = selectedCategoryPath.slice(0, index + 1);
    setSelectedCategoryPath(newPath);
    
    if (newPath.length === 0) {
      setCurrentCategoryChildren(categories?.filter(cat => !cat.parent) || []);
    } else {
      const lastCategory = newPath[newPath.length - 1];
      setCurrentCategoryChildren(
        categories.filter(cat => cat.parent === lastCategory.id)
      );
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
    setIsDragging(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImageSelect(e);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Handle template change
  const handleTemplateChange = (templateId) => {
    const tpl = templates.find(t => t.id === parseInt(templateId));
    if (tpl) {
      setFormData(prev => ({ ...prev, template_id: templateId }));
      setSelectedTemplate(tpl);
      setTemplateFields(tpl.fields || []);
      setErrors(prev => ({ ...prev, template: undefined }));
      
      // Initialize empty values for all fields in the template
      const newFieldValues = {};
      tpl.fields.forEach(field => {
        newFieldValues[field.id] = formData.field_values[field.id] || '';
      });
      setFormData(prev => ({ ...prev, field_values: newFieldValues }));
    }
  };

  // Handle template field value changes
  const handleFieldValueChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      field_values: {
        ...prev.field_values,
        [fieldId]: value
      }
    }));
    setErrors(prev => ({ ...prev, [`field_${fieldId}`]: undefined }));
  };

  // Render appropriate input for each field type
  const renderFieldInput = (field) => {
    const fieldValue = formData.field_values[field.id] || '';
    
    if (field.type === 'dropdown' && field.options?.length > 0) {
      return (
        <select
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors[`field_${field.id}`] ? 'border-red-500' : 'border-gray-300'
          }`}
          value={fieldValue}
          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
          required={field.required}
        >
          <option value="">Select an option</option>
          {field.options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.value}</option>
          ))}
        </select>
      );
    } else if (field.type === 'boolean') {
      return (
        <select
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors[`field_${field.id}`] ? 'border-red-500' : 'border-gray-300'
          }`}
          value={fieldValue}
          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
          required={field.required}
        >
          <option value="">Select</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    } else if (field.type === 'textarea') {
      return (
        <textarea
          value={fieldValue}
          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors[`field_${field.id}`] ? 'border-red-500' : 'border-gray-300'
          }`}
          required={field.required}
          rows={3}
        />
      );
    } else {
      return (
        <input
          type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors[`field_${field.id}`] ? 'border-red-500' : 'border-gray-300'
          }`}
          value={fieldValue}
          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
          required={field.required}
          step={field.type === 'currency' ? '0.01' : undefined}
        />
      );
    }
  };

  // Toggle accordion sections
  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.template_id) newErrors.template = 'Template is required';
    if (!formData.category_id) newErrors.category = 'Category is required';

    templateFields.forEach(field => {
      if (field.required && !formData.field_values[field.id]) {
        newErrors[`field_${field.id}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('custom_id', formData.custom_id.trim());
      payload.append('template_id', formData.template_id);
      if (formData.category_id) payload.append('category_id', formData.category_id);
      
      const fieldValueArray = Object.entries(formData.field_values)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value: value.toString()
        }));

      payload.append('field_values', JSON.stringify(fieldValueArray));
      
      if (formData.image) {
        payload.append('image', formData.image);
      } else if (!formData.imagePreview && selectedProduct?.image) {
        payload.append('image', '');
      }

      if (isEdit) {
        await onUpdateProduct(payload, selectedProduct.id);
      } else {
        await onCreateProduct(payload);
      }
      
      setShowAddForm(false);
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-gray-100"
          style={{ maxHeight: '90vh' }}
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              disabled={isSaving}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Top Section - Image and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image Upload */}
                <div className="col-span-1">
                  <div className="flex flex-col items-center">
                    <label 
                      className={`relative group cursor-pointer w-full h-48 rounded-lg border-2 flex items-center justify-center overflow-hidden ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
                      }`}
                      style={{ 
                        backgroundColor: formData.imagePreview ? 'transparent' : colors.cream + '20',
                        borderColor: formData.imagePreview ? 'transparent' : isDragging ? colors.primary : colors.border
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                    >
                      {formData.imagePreview ? (
                        <>
                          <img 
                            src={formData.imagePreview} 
                            alt="Product preview" 
                            className="w-full h-full object-contain p-2"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Click to change image
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                image: null,
                                imagePreview: null
                              }));
                            }}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                          >
                            <X size={18} className="text-gray-700" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500 space-y-2 p-4">
                          <Image size={36} style={{ color: colors.light }} />
                          <p className="text-center font-medium" style={{ color: colors.textMedium }}>
                            Drag & drop image or click to browse
                          </p>
                          <p className="text-xs text-center" style={{ color: colors.textMedium }}>
                            JPEG, PNG, or GIF (Max 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    {errors.image && (
                      <p className="text-sm text-red-500 mt-2">{errors.image}</p>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ borderColor: errors.name ? colors.error : colors.border }}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      SKU/Product ID
                    </label>
                    <input
                      type="text"
                      name="custom_id"
                      value={formData.custom_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ borderColor: colors.border }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Template *
                    </label>
                    <select
                      name="template_id"
                      value={formData.template_id}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.template ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ borderColor: errors.template ? colors.error : colors.border }}
                      required
                    >
                      <option value="">Select Template</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.fields?.length || 0} fields)
                        </option>
                      ))}
                    </select>
                    {errors.template && <p className="text-sm text-red-500 mt-1">{errors.template}</p>}
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Category *
                    </label>
                    <div 
                      className={`w-full border rounded-lg px-3 py-2 cursor-pointer ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ borderColor: errors.category ? colors.error : colors.border }}
                      onClick={() => toggleAccordion('category')}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`${selectedCategoryPath.length ? 'text-gray-900' : 'text-gray-400'}`}>
                          {selectedCategoryPath.length ? selectedCategoryPath.map(c => c.name).join(' › ') : 'Select category'}
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${activeAccordion === 'category' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}

                    <AnimatePresence>
                      {activeAccordion === 'category' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="p-3 border rounded-lg">
                            {/* Category Breadcrumbs */}
                            <div className="flex items-center flex-wrap gap-1 mb-2 text-sm">
                              <button
                                type="button"
                                onClick={() => navigateToCategory(-1)}
                                className={`px-2 py-1 rounded ${
                                  selectedCategoryPath.length > 0 ? 
                                    'text-blue-600 hover:bg-blue-50' : 'text-gray-400 cursor-default'
                                }`}
                              >
                                Root
                              </button>
                              
                              {selectedCategoryPath.map((category, index) => (
                                <React.Fragment key={category.id}>
                                  <ChevronRight size={16} className="text-gray-400" />
                                  <button
                                    type="button"
                                    onClick={() => navigateToCategory(index)}
                                    className="px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                                  >
                                    {category.name}
                                  </button>
                                </React.Fragment>
                              ))}
                            </div>
                            
                            {/* Category Selection Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                              {currentCategoryChildren.length > 0 ? (
                                currentCategoryChildren.map(category => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleCategorySelect(category)}
                                    className={`p-3 rounded-lg border text-center transition-colors flex justify-between items-center ${
                                      formData.category_id === category.id ? 
                                        'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="block truncate text-sm font-medium" style={{ color: colors.textDark }}>
                                      {category.name}
                                    </span>
                                    <ChevronRight size={14} className="text-gray-400" />
                                  </button>
                                ))
                              ) : (
                                <div className="col-span-3 p-2 text-center text-gray-500 text-sm">
                                  {selectedCategoryPath.length > 0 ? 'No more subcategories' : 'No categories available'}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Template Fields Section */}
              {selectedTemplate && templateFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold pb-2 border-b" style={{ 
                    color: colors.textDark,
                    borderColor: colors.border
                  }}>
                    {selectedTemplate.name} Specifications
                  </h3>
                  
                  {/* Basic Info Accordion */}
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex justify-between items-center p-3 hover:bg-gray-50"
                      onClick={() => toggleAccordion('basic')}
                    >
                      <span className="font-medium">Basic Information</span>
                      <ChevronDown size={16} className={`transition-transform ${activeAccordion === 'basic' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {activeAccordion === 'basic' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templateFields.filter(f => ['text', 'textarea', 'number', 'currency'].includes(f.type)).map((field) => (
                              <div key={field.id} className="space-y-1">
                                <label className="block text-sm font-medium" style={{ color: colors.textDark }}>
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderFieldInput(field)}
                                {errors[`field_${field.id}`] && (
                                  <p className="text-sm text-red-500 mt-1">{errors[`field_${field.id}`]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Options Accordion */}
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex justify-between items-center p-3 hover:bg-gray-50"
                      onClick={() => toggleAccordion('options')}
                    >
                      <span className="font-medium">Options</span>
                      <ChevronDown size={16} className={`transition-transform ${activeAccordion === 'options' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {activeAccordion === 'options' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templateFields.filter(f => ['dropdown', 'boolean'].includes(f.type)).map((field) => (
                              <div key={field.id} className="space-y-1">
                                <label className="block text-sm font-medium" style={{ color: colors.textDark }}>
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderFieldInput(field)}
                                {errors[`field_${field.id}`] && (
                                  <p className="text-sm text-red-500 mt-1">{errors[`field_${field.id}`]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: colors.border }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg border font-medium"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.textDark
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: colors.primary }}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : isEdit ? 'Update Product' : 'Create Product'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;