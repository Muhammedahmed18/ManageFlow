import React, { useState } from 'react';
import { List, Calendar, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const TemplateManagement = ({
  templates = [],
  searchQuery = '',
  onEdit,
  onDelete,
  colors = {
    primary: '#1C2E4A',
    secondary: '#52677D',
    accent: '#0F1A2B',
    light: '#BDC4D4',
    cream: '#D1CFC9',
    textDark: '#1A202C',
    textMedium: '#4A5568',
    error: '#E53E3E',
    warning: '#f59e0b'
  },
  setShowAddForm,
  setSelectedTemplate,
  handlePreviewItem,
  selectedTemplate
}) => {
  const [sortOption, setSortOption] = useState('newest');
  
  console.log('Rendering TemplateManagement with:', {
    templates,
    filteredTemplates: templates.filter((template) =>
      (template?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    sortedTemplates: [...templates].sort((a, b) => {
      switch (sortOption) {
        case 'newest': return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        default: return 0;
      }
    })
  });

  const filteredTemplates = templates.filter((template) =>
    (template?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortOption) {
      case 'newest': return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
      case 'name-asc': return (a.name || '').localeCompare(b.name || '');
      case 'name-desc': return (b.name || '').localeCompare(a.name || '');
      default: return 0;
    }
  });

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg" style={{ color: colors.textDark }}>All Templates</h2>
          <div className="flex items-center gap-2">
            <select 
              className="border border-gray-200 rounded-lg p-2 text-sm" 
              style={{ 
                color: colors.textMedium,
                backgroundColor: colors.cream 
              }}
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="newest">Sort by: Newest</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="name-asc">Sort by: Name A-Z</option>
              <option value="name-desc">Sort by: Name Z-A</option>
            </select>
          </div>
        </div>

        {sortedTemplates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Template Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Fields</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg" 
                             style={{ backgroundColor: colors.light, color: colors.primary }}>
                          <List size={20} />
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handlePreviewItem(template)}
                            className="font-medium text-left hover:underline focus:outline-none"
                            style={{ color: colors.textDark }}
                          >
                            {template.name}
                          </button>
                          <div className="text-xs" style={{ color: colors.textMedium }}>ID: {template.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: colors.light,
                        color: colors.primary
                      }}>
                        {template.fields?.length || 0} fields
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center" style={{ color: colors.textMedium }}>
                        <Calendar size={14} className="mr-2" />
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        template.status === 'active'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`mr-1.5 w-2 h-2 rounded-full ${
                          template.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                        }`}></span>
                        {template.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowAddForm(true);
                          }}
                          className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: colors.primary }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(template.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: colors.error }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <List size={48} className="mx-auto mb-4" style={{ color: colors.light }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textDark }}>No templates found</h3>
            <p style={{ color: colors.textMedium }}>
              {searchQuery ? "Try different search terms or" : "Get started by"} creating your first template
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-5 py-2.5 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              + New Template
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagement;