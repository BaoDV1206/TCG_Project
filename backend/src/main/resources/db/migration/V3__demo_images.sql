-- Ảnh demo cho dữ liệu mẫu (file nằm ở frontend/public/demo-images)
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, '/demo-images/' || p.slug || '.jpg', 0
FROM products p
WHERE p.slug IN (
    'pokemon-sv8-surging-sparks-booster-box-en',
    'pokemon-sv8-surging-sparks-booster-pack-en',
    'pokemon-sv8-surging-sparks-elite-trainer-box',
    'pokemon-sv8a-terastal-festival-ex-booster-box-jp',
    'pokemon-sv9-battle-partners-booster-box-jp',
    'pokemon-sv10-destined-rivals-booster-box-en',
    'pikachu-ex-sar-surging-sparks-nm',
    'pokemon-collection-box-hop-qua',
    'one-piece-op-09-emperors-in-the-new-world-booster-box-jp',
    'one-piece-op-09-booster-pack-jp',
    'one-piece-op-10-royal-blood-booster-box-en',
    'one-piece-op-11-a-fist-of-divine-speed-booster-box-jp',
    'one-piece-eb-02-anime-25th-collection-booster-box-jp',
    'one-piece-op-14-booster-box-jp',
    'one-piece-starter-deck-straw-hat-crew-en',
    'monkey-d-luffy-sec-manga-op-09-nm',
    'yugioh-quarter-century-bonanza-booster-box-en',
    'yugioh-alliance-insight-booster-box-en',
    'yugioh-structure-deck-en',
    'dragon-ball-fusion-world-fb04-ultra-limit-booster-box-en',
    'dragon-ball-fusion-world-starter-deck-en',
    'disney-lorcana-azurite-sea-booster-box-en',
    'disney-lorcana-azurite-sea-gift-set',
    'mtg-foundations-play-booster-box-en',
    'digimon-card-game-booster-box-en'
)
AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id);

-- OP-14 dùng tên set thật cho khớp với ảnh
UPDATE card_sets SET name = 'The Azure Sea''s Seven', alias = 'OP14, Azure Sea, Thất Vũ Hải'
WHERE slug = 'op-14-bo-moi';

-- tính lại dữ liệu tìm kiếm cho các sản phẩm thuộc set vừa đổi tên (DataInitializer sẽ build lại)
UPDATE products SET search_text = NULL
WHERE set_id = (SELECT id FROM card_sets WHERE slug = 'op-14-bo-moi');
