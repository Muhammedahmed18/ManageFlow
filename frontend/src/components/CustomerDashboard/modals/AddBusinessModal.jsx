import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const AddBusinessModal = ({
  showAddModal,
  setShowAddModal,
  newBusiness,
  setNewBusiness,
  errors,
  setErrors,
  isSubmitting,
  handleAddBusiness,
  colors,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-2xl z-50"
        style={{ borderColor: colors.border }}
      >
        <div className="px-4 py-3 mb-4 rounded-t-lg -mx-6 -mt-6" 
             style={{ 
               background: colors.cardHeaderBg, 
               color: colors.white,
               borderTopLeftRadius: '0.5rem',
               borderTopRightRadius: '0.5rem'
             }}>
          <h2 className="text-xl font-bold">Add New Business</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Business Name *</label>
            <input 
              type="text" 
              value={newBusiness.name}
              onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
              style={{ 
                borderColor: colors.border,
                color: colors.text,
                focusRingColor: colors.accent
              }}
              placeholder="Enter business name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Slogan (Optional)</label>
            <input 
              type="text" 
              value={newBusiness.slogan}
              onChange={(e) => setNewBusiness({...newBusiness, slogan: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
              style={{ 
                borderColor: colors.border,
                color: colors.text,
                focusRingColor: colors.accent
              }}
              placeholder="Enter slogan"
            />
            {errors.slogan && <p className="text-red-500 text-xs mt-1">{errors.slogan}</p>}
          </div>
          
                     <div>
             <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Location</label>
             <input
               type="text"
               value={newBusiness.shipping_country}
               disabled
               className="w-full px-4 py-2 rounded-lg border bg-gray-50 text-gray-500 cursor-not-allowed transition text-sm"
               style={{ 
                 borderColor: colors.border
               }}
               placeholder="Location from your profile settings"
             />
             <p className="text-xs text-gray-500 mt-1">
               Location can only be changed from Settings page
             </p>
           </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowAddModal(false);
              setErrors({});
            }}
            disabled={isSubmitting}
            className="flex-1 py-2 rounded-lg transition-all border text-sm font-medium"
            style={{ 
              borderColor: colors.border,
              color: colors.textLight
            }}
          >
            Cancel
          </motion.button>
                     <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={handleAddBusiness}
             disabled={isSubmitting}
             className="flex-1 py-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium text-white"
             style={{ 
               backgroundColor: colors.primary
             }}
           >
             {isSubmitting ? (
               <>
                 <Loader2 className="animate-spin mr-2" size={16} />
                 Creating...
               </>
             ) : 'Create Business'}
           </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddBusinessModal;
