import React, { useState, useRef, useEffect } from 'react';
import api from '../../../services/authService';
import { FiX, FiSave } from 'react-icons/fi';

const FieldPlacer = ({ templateId, templateImageUrl, pdfWidthPt, pdfHeightPt, businessId }) => {
  const [placedFields, setPlacedFields] = useState([]);
  const [digitalFormFields, setDigitalFormFields] = useState([]);
  const [draggedField, setDraggedField] = useState(null);
  const [unsavedPositions, setUnsavedPositions] = useState({});
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Helper to fetch placed fields
  const fetchPlacedFields = async () => {
    const placedRes = await api.get(`/management/template-upload/${templateId}/positions/`);
    setPlacedFields(placedRes.data);
  };

  useEffect(() => {
    const fetchData = async () => {
      const digitalRes = await api.get('/management/order-form-templates/');
      const match = digitalRes.data.find(t => t.business === parseInt(businessId));
      if (match) setDigitalFormFields(match.fields);
      await fetchPlacedFields();
    };
    fetchData();
  }, [templateId, businessId]);

  const imagePxToPdfPt = (xPx, yPx, img) => {
    if (!pdfWidthPt || !pdfHeightPt || !img) return { x: 0, y: 0 };
    const xPt = (xPx / img.naturalWidth) * pdfWidthPt;
    const yPt = pdfHeightPt - (yPx / img.naturalHeight) * pdfHeightPt;
    return { x: xPt, y: yPt };
  };

  const pdfPtToImagePx = (xPt, yPt, img) => {
    if (!pdfWidthPt || !pdfHeightPt || !img) return { x: 0, y: 0 };
    const xPx = (xPt / pdfWidthPt) * img.naturalWidth;
    const yPx = (1 - (yPt / pdfHeightPt)) * img.naturalHeight;
    return { x: xPx, y: yPx };
  };

  const handleFieldMouseDown = (fieldId, e) => {
    e.preventDefault();
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const field = placedFields.find(f => f.id === fieldId);
    const pos = unsavedPositions[fieldId] || { x: field.x, y: field.y };
    const fieldOffset = pdfPtToImagePx(pos.x, pos.y, img);
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) - (fieldOffset.x * rect.width / img.naturalWidth),
      y: (e.clientY - rect.top) - (fieldOffset.y * rect.height / img.naturalHeight)
    };
    setSelectedFieldId(fieldId);

    const onMouseMove = (moveEvent) => {
      const moveRect = img.getBoundingClientRect();
      const scaleX = img.naturalWidth / moveRect.width;
      const scaleY = img.naturalHeight / moveRect.height;
      const xPx = (moveEvent.clientX - moveRect.left - dragOffsetRef.current.x) * scaleX;
      const yPx = (moveEvent.clientY - moveRect.top - dragOffsetRef.current.y) * scaleY;
      const { x, y } = imagePxToPdfPt(xPx, yPx, img);
      setUnsavedPositions(prev => ({ ...prev, [fieldId]: { x, y } }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleUpdate = async () => {
    for (const [id, pos] of Object.entries(unsavedPositions)) {
      await api.put(`/management/template-upload/${templateId}/positions/${id}/`, { ...pos, page: 1 });
    }
    setPlacedFields(prev => prev.map(f => unsavedPositions[f.id] ? { ...f, ...unsavedPositions[f.id] } : f));
    setUnsavedPositions({});
    if (window.toast) window.toast.success('Positions updated');
  };

  const handleDeleteField = async (fieldId) => {
    await api.delete(`/management/template-upload/${templateId}/positions/${fieldId}/`);
    setPlacedFields(prev => prev.filter(f => f.id !== fieldId));
    setSelectedFieldId(null);
  };

  const getLabel = (key) => {
    const match = digitalFormFields.find(f => f.key === key);
    return match?.label || key;
  };

  return (
    <div className="flex gap-4">
      <div className="w-72 bg-white border p-4 rounded shadow">
        <h3 className="font-bold mb-2">Fields</h3>
        {digitalFormFields.map(f => (
          <div
            key={f.id}
            draggable
            onDragStart={(e) => {
              setDraggedField({ key: f.key });
              e.dataTransfer.setData('text/plain', f.key);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="p-2 border rounded mb-2 bg-gray-50 cursor-move"
          >
            {f.label}
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div
          ref={containerRef}
          className="relative inline-block"
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            const img = imageRef.current;
            if (!img) return;

            const rect = img.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
            const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
            const { x: xPt, y: yPt } = imagePxToPdfPt(x, y, img);

            if (!draggedField || !draggedField.key) {
              console.warn("⚠️ Invalid field dropped:", draggedField);
              return;
            }

            try {
              const formRes = await api.get('/management/order-form-templates/');
              const formTemplate = formRes.data.find(t => t.business === parseInt(businessId));
              if (!formTemplate) {
                throw new Error("❌ No OrderFormTemplate found for this business");
              }

              const payload = {
                field_key: draggedField.key,
                x: xPt,
                y: yPt,
                page: 1,
              };

              console.log("📤 Posting field position:", payload);

              const existing = placedFields.find(p => p.field_key === draggedField.key);

              if (existing) {
                await api.put(`/management/template-upload/${templateId}/positions/${existing.id}/`, payload);
              } else {
                await api.post(`/management/template-upload/${templateId}/positions/`, payload);
              }

              setDraggedField(null);
              await fetchPlacedFields();
            } catch (err) {
              console.error("❌ Failed to update field position:", err?.response?.data || err.message);
              if (window.toast) window.toast.error("Failed to update field position. See console.");
            }
          }}
        >
          <img
            ref={imageRef}
            src={templateImageUrl}
            alt="Template Preview"
            className="border shadow"
            onLoad={() => setImageLoaded(true)}
          />

          {imageLoaded && placedFields.map(field => {
            const img = imageRef.current;
            if (!img) return null;
            const pos = unsavedPositions[field.id] || { x: field.x, y: field.y };
            if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return null;
            const { x, y } = pdfPtToImagePx(pos.x, pos.y, img);
            if (isNaN(x) || isNaN(y)) return null;
            return (
              <div
                key={field.id}
                onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
                className="absolute z-50 cursor-move group"
                style={{
                  top: `${y}px`,
                  left: `${x}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '20px'
                }}
              >
                <div className="text-[10px] text-blue-800 px-1 overflow-hidden truncate">
                  {getLabel(field.field_key)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteField(field.id);
                  }}
                  className="absolute -right-2 -top-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px]"
                  title="Delete field"
                >
                  <FiX size={8} />
                </button>
              </div>
            );
          })}
        </div>

        {Object.keys(unsavedPositions).length > 0 && (
          <button
            onClick={handleUpdate}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiSave /> Update Field Positions
          </button>
        )}
      </div>
    </div>
  );
};

export default FieldPlacer;
