import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import Loading from "@/shared/components/loading";
import { ProductCard } from "../components/product-card";
import useProducts from "../hooks/use-products";
import { ProductModal } from "../components/product-modal";
import {useState} from 'react';
import {isProductInCategory} from '@site/catalog';

export default function ProductsPage() {
  const [categoryFilter,setCategoryFilter]=useState('');
  const {
    products,
    search,
    isLoading,
    categorySuggestions,
    formData,
    variants,
    showModal,
    setShowModal,
    editingProduct,
    setSearch,
    setFormData,
    setVariants,
    handleSubmit,
    handleNew,
    handleEdit,
    handleDelete,
    addVariant,
    updateVariant,
    removeVariant,
    moveVariant,
    moveProduct,
    resetProductOrder,
  } = useProducts();
  const visibleProducts=products.filter(product=>!categoryFilter||isProductInCategory(product.category,categoryFilter));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="gap-4 md:gap-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-2 mt-1">
        <div>
          <h2 className="text-2xl font-bold">Productos</h2>
          <p className="text-gray-600">
            Gestiona el catálogo y decide en qué orden lo ven los clientes
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="flex-1" />
        <select aria-label="Filtrar productos por categoría" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 sm:max-w-xs"><option value="">Todas las categorías</option>{categorySuggestions.map(name=><option key={name} value={name}>{name}</option>)}</select>
        <ProductModal
          typeform="add"
          open={showModal && !editingProduct}
          setOpen={setShowModal}
          handleShow={() => handleNew()}
          handleSubmit={handleSubmit}
          formData={formData}
          categorySuggestions={categorySuggestions}
          setFormData={setFormData}
          variants={variants}
          setVariants={setVariants}
          editingProduct={null}
          addVariant={addVariant}
          moveVariant={moveVariant}
          updateVariant={updateVariant}
          removeVariant={removeVariant}
        />
      </div>

      {/* Divisor */}
      <hr className="my-4 border-gray-300" />

      {!search && !categoryFilter ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Usa las flechas de cada producto para cambiar su posición. El orden
              se guarda en el servidor y es <strong>el mismo que ven los clientes
              en la tienda</strong>.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
              onClick={resetProductOrder}
            >
              Volver al orden automático
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Hay filtros activos. Limpia la búsqueda y la categoría para reordenar el catálogo
          completo sin mezclar posiciones ocultas.
        </div>
      )}

      {/* Products Grid */}
      {visibleProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
          <p className="text-gray-400 text-sm mt-2">
            {search || categoryFilter ? 'Prueba otra categoría o término de búsqueda' : 'Agrega tu primer producto para comenzar'}
          </p>
        </div>
      )}

      <div className="overflow-y-auto max-h-[calc(100vh-280px)] mt-4 pt-2 pb-2 px-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              totalProducts={products.length}
              canReorder={!search && !categoryFilter}
              moveProduct={moveProduct}
              handleEdit={() => handleEdit(product)}
              handleDelete={() => handleDelete(product.id)}
              open={showModal && editingProduct?.id === product.id}
              setOpen={setShowModal}
              handleSubmit={handleSubmit}
              formData={formData}
              categorySuggestions={categorySuggestions}
              setFormData={setFormData}
              variants={variants}
              setVariants={setVariants}
              editingProduct={editingProduct}
              addVariant={addVariant}
              moveVariant={moveVariant}
              updateVariant={updateVariant}
              removeVariant={removeVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
