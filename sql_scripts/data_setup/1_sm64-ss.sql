CREATE TABLE IF NOT EXISTS sm64_ss (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ss_rta BOOLEAN NOT NULL DEFAULT 0
);

INSERT INTO sm64_ss (id, name) VALUES 
-- C1: Bob-omb Battlefield
('bob1', 'Big Bob-omb on the Summit'), ('bob2', 'Footrace with Koopa the Quick'), ('bob3', 'Shoot to the Island in the Sky'), ('bob4', 'Find the Eight Red Coins'), ('bob5', 'Mario Wings to the Sky'), ('bob6', 'Behind Chain Chomp''s Gate'), ('bob100', '100 Coin Star'),
-- C2: Whomp''s Fortress
('wf1', 'Chip Off Whomp''s Block'), ('wf2', 'To the Top of the Fortress'), ('wf3', 'Shoot into the Wild Blue'), ('wf4', 'Red Coins on the Floating Isle'), ('wf5', 'Fall onto the Caged Island'), ('wf6', 'Blast Away the Wall'), ('wf100', '100 Coin Star'),
-- C3: Jolly Roger Bay
('jrb1', 'Plunder in the Sunken Ship'), ('jrb2', 'Can the Eel Come Out to Play?'), ('jrb3', 'Treasure in the Ocean Cave'), ('jrb4', 'Blast to the Stone Pillar'), ('jrb5', 'Red Coins on the Ship Afloat'), ('jrb6', 'Through the Jet Stream'), ('jrb100', '100 Coin Star'),
-- C4: Cool, Cool Mountain
('ccm1', 'Slip Slidin'' Away'), ('ccm2', 'Li''l Penguin Lost'), ('ccm3', 'Big Penguin Race'), ('ccm4', 'Frosty Slide for 8 Red Coins'), ('ccm5', 'Snowman''s Lost His Head'), ('ccm6', 'Wall Kicks Will Work'), ('ccm100', '100 Coin Star'),
-- C5: Big Boo''s Haunt
('bbh1', 'Go on a Ghost Hunt'), ('bbh2', 'Big Boo''s Merry-Go-Round'), ('bbh3', 'Secret of the Haunted Books'), ('bbh4', 'Seek the 8 Red Coins'), ('bbh5', 'Big Boo''s Balcony'), ('bbh6', 'Eye to Eye in the Secret Room'), ('bbh100', '100 Coin Star'),
-- C6: Hazy Maze Cave
('hmc1', 'Swimming Beast in the Cavern'), ('hmc2', 'Elevate for 8 Red Coins'), ('hmc3', 'Metal Head Mario Can Move!'), ('hmc4', 'Navigating the Toxic Maze'), ('hmc5', 'A-Maze-Ing Emergency Exit'), ('hmc6', 'Watch for Rolling Rocks'), ('hmc100', '100 Coin Star'),
-- C100: Lethal Lava Land
('lll1', 'Boil the Big Bully'), ('lll2', 'Bully the Bullies'), ('lll3', '8-Coin Puzzle with 15 Pieces'), ('lll4', 'Red-Hot Log Rolling'), ('lll5', 'Hot-Foot-It into the Volcano'), ('lll6', 'Elevator Tour in the Volcano'), ('lll100', '100 Coin Star'),
-- C8: Shifting Sand Land
('ssl1', 'In the Talons of the Big Bird'), ('ssl2', 'Shining Atop the Pyramid'), ('ssl3', 'Inside the Ancient Pyramid'), ('ssl4', 'Stand Tall on the Four Pillars'), ('ssl5', 'Free Flying for 8 Red Coins'), ('ssl6', 'Pyramid Puzzle'), ('ssl100', '100 Coin Star'),
-- C9: Dire, Dire Docks
('ddd1', 'Board Bowser''s Sub'), ('ddd2', 'Chests in the Current'), ('ddd3', 'Pole-Jumping for Red Coins'), ('ddd4', 'Through the Jet Stream'), ('ddd5', 'The Manta Ray''s Reward'), ('ddd6', 'Collect the Caps...'), ('ddd100', '100 Coin Star'),
-- C10: Snowman''s Land
('sl1', 'Snowman''s Big Head'), ('sl2', 'Chill with the Bully'), ('sl3', 'In the Deep Freeze'), ('sl4', 'Whirl from the Freezing Pond'), ('sl5', 'Shell Shreddin'' for Red Coins'), ('sl6', 'Into the Igloo'), ('sl100', '100 Coin Star'),
-- C11: Wet-Dry World
('wdw1', 'Shocking Arrow Lifts!'), ('wdw2', 'Top o'' the Town'), ('wdw3', 'Secrets in the Shallows & Sky'), ('wdw4', 'Express Elevator--Hurry Up!'), ('wdw5', 'Go to Town for Red Coins'), ('wdw6', 'Quick Race Through Downtown!'), ('wdw100', '100 Coin Star'),
-- C12: Tall, Tall Mountain
('ttm1', 'Scale the Mountain'), ('ttm2', 'Mystery of the Monkey Cage'), ('ttm3', 'Scary ''Shrooms, Red Coins'), ('ttm4', 'Mysterious Mountainside'), ('ttm5', 'Breathtaking View from Bridge'), ('ttm6', 'Blast to the Lonely Mushroom'), ('ttm100', '100 Coin Star'),
-- C13: Tiny-Huge Island
('thi1', 'Pluck the Piranha Flower'), ('thi2', 'The Tip Top of the Huge Island'), ('thi3', 'Rematch with Koopa the Quick'), ('thi4', 'Five Itty Bitty Secrets'), ('thi5', 'Wiggler''s Red Coins'), ('thi6', 'Make Wiggler Squirm'), ('thi100', '100 Coin Star'),
-- C14: Tick Tock Clock
('ttc1', 'Roll Into the Cage'), ('ttc2', 'The Pit and the Pendulums'), ('ttc3', 'Get a Hand'), ('ttc4', 'Stomp on the Thwomp'), ('ttc5', 'Timed Jumps on Moving Bars'), ('ttc6', 'Stop Time for Red Coins'), ('ttc100', '100 Coin Star'),
-- C15: Rainbow Ride
('rr1', 'Cruiser Crossing the Rainbow'), ('rr2', 'The Big House in the Sky'), ('rr3', 'Coins Amassed in a Maze'), ('rr4', 'Swingin'' in the Breeze'), ('rr5', 'Tricky Triangles!'), ('rr6', 'Somewhere Over the Rainbow'), ('rr100', '100 Coin Star'),
-- Castle Secret Stars
('pss1', 'The Princess''s Secret Slide (Box)'), ('pss2', 'The Princess''s Secret Slide (Under 21s)'), ('sa', 'The Secret Aquarium'), ('wmotr', 'Wing Mario Over the Rainbow'), ('wc', 'Tower of the Wing Cap (Red Coins)'), ('vc', 'Vanish Cap Under the Moat (Red Coins)'), ('bitfs', 'Bowser in the Fire Sea (Red Coins)'), ('bitdw', 'Bowser in the Dark World (Red Coins)'), ('bits', 'Bowser in the Sky (Red Coins)'), ('mc', 'Cavern of the Metal Cap (Red Coins)'), ('bitdwc', 'Bowser in the Dark World (Course)'), ('bitfsc', 'Bowser in the Fire Sea (Course)'), ('bitsc', 'Bowser in the Sky (Course)')
ON CONFLICT DO NOTHING;