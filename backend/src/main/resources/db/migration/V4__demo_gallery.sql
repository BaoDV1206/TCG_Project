-- Thêm 4 ảnh phụ (pack/box cùng set + thẻ hot) cho các sản phẩm đang dùng ảnh demo.
-- Chỉ áp dụng khi ảnh chính vẫn là ảnh demo (admin chưa thay ảnh khác).
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, '/demo-images/' || p.slug || '-' || n || '.jpg', n - 1
FROM products p
CROSS JOIN generate_series(2, 5) AS n
WHERE EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.url = '/demo-images/' || p.slug || '.jpg')
  AND (SELECT count(*) FROM product_images i WHERE i.product_id = p.id) = 1;
