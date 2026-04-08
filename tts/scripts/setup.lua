--[[
    W.A.R H.A.M.S — Tabletop Simulator Board Setup Script
    Handles Random and Fixed board layout for a 61-hex circular grid.

    Hex breakdown:
      15 Resource tiles (3 Oil Rigs, 3 Power Plants, 3 Factories, 3 Radar Dishes, 3 Cities/Villages)
       3 Separatist Bases (numbered 2, 4, 6)
       6 Spaceport Drop Zones (numbered 1-6)
      37 Terrain tiles
    ─────────────────────────────────────────────────────────
    Number tokens placed on the 15 resource hexes:
      2×1, 2×2, 3×3, 3×4, 3×5, 3×6 = 16 tokens → 15 hexes (one hex receives 2)
]]

-------------------------------------------------------------------------------
-- Constants
-------------------------------------------------------------------------------

local HEX_SIZE   = 3.5   -- flat-top hex radius in TTS units
local TILE_Y     = 1.1   -- tile surface height
local TOKEN_Y    = 1.8   -- number-token height (above tile)
local TILE_TAG   = "WARHAMS_HEX"  -- tag for cleanup identification

-- Tile definitions
local TILE_POOL = {
    {type = "Oil Rig",         imageURL = "https://placehold.co/200x200/1a1a1a/ffffff.png?text=OIL",       count = 3,  resource = true},
    {type = "Power Plant",     imageURL = "https://placehold.co/200x200/e6d200/000000.png?text=POWER",     count = 3,  resource = true},
    {type = "Factory",         imageURL = "https://placehold.co/200x200/cc1a1a/ffffff.png?text=FACTORY",    count = 3,  resource = true},
    {type = "Radar Dish",      imageURL = "https://placehold.co/200x200/3366e6/ffffff.png?text=INTEL",      count = 3,  resource = true},
    {type = "City/Village",    imageURL = "https://placehold.co/200x200/1ab333/ffffff.png?text=CITY",       count = 3,  resource = true},
    {type = "Separatist Base", imageURL = "https://placehold.co/200x200/666666/ffffff.png?text=SEP+BASE",   count = 3,  resource = false, numbers = {2, 4, 6}},
    {type = "Spaceport",       imageURL = "https://placehold.co/200x200/9933cc/ffffff.png?text=SPACEPORT",  count = 6,  resource = false, numbers = {1, 2, 3, 4, 5, 6}},
    {type = "Terrain",         imageURL = "https://placehold.co/200x200/998866/ffffff.png?text=TERRAIN",    count = 37, resource = false},
}

-- Number token pool for the 15 resource hexes (16 tokens total)
local NUMBER_TOKEN_POOL = {1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6}

-------------------------------------------------------------------------------
-- Hex Grid Utilities
-------------------------------------------------------------------------------

--- Convert axial coordinates (q, r) to a TTS world position.
-- Uses flat-top hex orientation.
function axialToWorld(q, r)
    local x = HEX_SIZE * (3/2 * q)
    local z = HEX_SIZE * (math.sqrt(3)/2 * q + math.sqrt(3) * r)
    return {x = x, y = TILE_Y, z = z}
end

--- Generate all 61 axial coordinate pairs for rings 0-4.
-- Ring 0: 1 hex, Ring 1: 6, Ring 2: 12, Ring 3: 18, Ring 4: 24 = 61 total.
function generateHexPositions()
    local positions = {}

    -- Ring 0 — center
    table.insert(positions, {q = 0, r = 0})

    -- Rings 1-4
    -- Cube direction vectors for the six hex sides
    local directions = {
        {dq =  1, dr =  0},
        {dq =  0, dr =  1},
        {dq = -1, dr =  1},
        {dq = -1, dr =  0},
        {dq =  0, dr = -1},
        {dq =  1, dr = -1},
    }

    for ring = 1, 4 do
        -- Start at the "top-right" corner of the ring
        local q = ring
        local r = 0

        for side = 1, 6 do
            for step = 1, ring do
                table.insert(positions, {q = q, r = r})
                q = q + directions[side].dq
                r = r + directions[side].dr
            end
        end
    end

    return positions
end

-------------------------------------------------------------------------------
-- Shuffle Utility (Fisher-Yates)
-------------------------------------------------------------------------------

function shuffle(t)
    for i = #t, 2, -1 do
        local j = math.random(1, i)
        t[i], t[j] = t[j], t[i]
    end
    return t
end

-------------------------------------------------------------------------------
-- Flat Tile Pool Builder
-------------------------------------------------------------------------------

--- Expand TILE_POOL into a flat list of 61 individual tile entries.
function buildFlatTilePool()
    local flat = {}
    for _, def in ipairs(TILE_POOL) do
        for i = 1, def.count do
            local entry = {
                type     = def.type,
                imageURL = def.imageURL,
                resource = def.resource,
            }
            -- Assign fixed numbers for Separatist Bases and Spaceports
            if def.numbers then
                entry.number = def.numbers[i]
            end
            table.insert(flat, entry)
        end
    end
    return flat
end

-------------------------------------------------------------------------------
-- Tile & Token Spawning
-------------------------------------------------------------------------------

--- Spawn a single hex tile at the given world position.
-- Uses spawnObjectData with Custom_Tile (Type=1 hex).
function spawnHexTile(position, tileData, label)
    spawnObjectData({
        data = {
            Name = "Custom_Tile",
            Transform = {
                posX = position.x, posY = position.y, posZ = position.z,
                rotX = 0, rotY = 0, rotZ = 0,
                scaleX = 1.5, scaleY = 1, scaleZ = 1.5
            },
            Nickname = tileData.type,
            Description = label or "",
            ColorDiffuse = {r=1, g=1, b=1},
            Locked = true,
            Grid = true,
            Snap = true,
            Autoraise = true,
            Sticky = true,
            Tooltip = true,
            GridProjection = false,
            CustomImage = {
                ImageURL = tileData.imageURL,
                ImageSecondaryURL = "",
                WidthScale = 0,
                CustomTile = {
                    Type = 1,
                    Thickness = 0.1,
                    Stackable = false,
                    Stretch = true
                }
            }
        },
        callback_function = function(spawned)
            spawned.addTag(TILE_TAG)
        end
    })
end

--- Spawn a number token above a hex tile.
-- Uses spawnObjectData with Custom_Tile (Type=2 circle).
function spawnNumberToken(position, number)
    local tokenPos = {x = position.x, y = TOKEN_Y, z = position.z}
    spawnObjectData({
        data = {
            Name = "Custom_Tile",
            Transform = {
                posX = tokenPos.x, posY = tokenPos.y, posZ = tokenPos.z,
                rotX = 0, rotY = 0, rotZ = 0,
                scaleX = 0.4, scaleY = 1, scaleZ = 0.4
            },
            Nickname = "#" .. tostring(number),
            Description = "Resource number: " .. tostring(number),
            ColorDiffuse = {r=1, g=1, b=1},
            Locked = true,
            Grid = true, Snap = true, Autoraise = true, Sticky = true, Tooltip = true, GridProjection = false,
            CustomImage = {
                ImageURL = "https://placehold.co/100x100/f5f0d0/333333.png?text=" .. tostring(number),
                ImageSecondaryURL = "",
                WidthScale = 0,
                CustomTile = {
                    Type = 2,
                    Thickness = 0.05,
                    Stackable = false,
                    Stretch = true
                }
            }
        },
        callback_function = function(spawned)
            spawned.addTag(TILE_TAG)
        end
    })
end

--- Spawn a second number token offset slightly so both are visible.
function spawnNumberTokenOffset(position, number)
    local tokenPos = {x = position.x + 0.5, y = TOKEN_Y, z = position.z + 0.3}
    spawnObjectData({
        data = {
            Name = "Custom_Tile",
            Transform = {
                posX = tokenPos.x, posY = tokenPos.y, posZ = tokenPos.z,
                rotX = 0, rotY = 0, rotZ = 0,
                scaleX = 0.4, scaleY = 1, scaleZ = 0.4
            },
            Nickname = "#" .. tostring(number),
            Description = "Resource number: " .. tostring(number) .. " (2nd)",
            ColorDiffuse = {r=1, g=1, b=1},
            Locked = true,
            Grid = true, Snap = true, Autoraise = true, Sticky = true, Tooltip = true, GridProjection = false,
            CustomImage = {
                ImageURL = "https://placehold.co/100x100/f0e8c0/333333.png?text=" .. tostring(number),
                ImageSecondaryURL = "",
                WidthScale = 0,
                CustomTile = {
                    Type = 2,
                    Thickness = 0.05,
                    Stackable = false,
                    Stretch = true
                }
            }
        },
        callback_function = function(spawned)
            spawned.addTag(TILE_TAG)
        end
    })
end

-------------------------------------------------------------------------------
-- Cleanup — remove all tiles from a previous setup
-------------------------------------------------------------------------------

function cleanupBoard()
    local allObjects = getObjects()
    for _, obj in ipairs(allObjects) do
        if obj.hasTag(TILE_TAG) then
            obj.destruct()
        end
    end
end

-------------------------------------------------------------------------------
-- Place Number Tokens on Resource Hexes
-------------------------------------------------------------------------------

--- Distribute number tokens across the resource hex positions.
-- 16 tokens go onto 15 hexes; one randomly chosen hex receives two.
function placeNumberTokens(resourcePositions)
    local tokens = {unpack(NUMBER_TOKEN_POOL)}
    shuffle(tokens)

    -- First 15 tokens go 1-per-hex
    for i = 1, 15 do
        spawnNumberToken(resourcePositions[i], tokens[i])
    end

    -- 16th token goes on a random resource hex (that hex now has 2)
    local doubleIdx = math.random(1, 15)
    spawnNumberTokenOffset(resourcePositions[doubleIdx], tokens[16])
end

-------------------------------------------------------------------------------
-- Random Board Setup
-------------------------------------------------------------------------------

function setupRandomBoard()
    cleanupBoard()

    Wait.frames(function()
        math.randomseed(os.time())

        -- 1. Generate all 61 hex positions
        local hexCoords = generateHexPositions()

        -- 2. Build and shuffle the flat tile pool
        local tiles = buildFlatTilePool()
        shuffle(tiles)

        -- 3. Place each tile; collect resource-hex world positions
        local resourcePositions = {}

        for i, coord in ipairs(hexCoords) do
            local worldPos = axialToWorld(coord.q, coord.r)
            local tile = tiles[i]

            -- Build a display label
            local label = tile.type
            if tile.number then
                label = label .. " #" .. tostring(tile.number)
            end

            spawnHexTile(worldPos, tile, label)

            if tile.resource then
                table.insert(resourcePositions, worldPos)
            end
        end

        -- 4. Place number tokens on the 15 resource hexes
        Wait.frames(function()
            placeNumberTokens(resourcePositions)
            broadcastToAll("W.A.R H.A.M.S — Random Board generated!", {r=0.2, g=0.8, b=1})
        end, 30)
    end, 5)
end

-------------------------------------------------------------------------------
-- Fixed Board Setup — balanced, predetermined layout for playtesting
-------------------------------------------------------------------------------

--[[
    Fixed layout strategy:
      • Center (ring 0): Terrain — neutral ground
      • Ring 1 (6 hexes): 3 resources spread evenly, 3 terrain
      • Ring 2 (12 hexes): 6 resources, 3 Separatist Bases, 3 terrain
      • Ring 3 (18 hexes): 6 resources, 6 Spaceports, 6 terrain
      • Ring 4 (24 hexes): all Terrain (outer border)
    Resources are interleaved by type so no two of the same kind are adjacent.
]]

function setupFixedBoard()
    cleanupBoard()

    Wait.frames(function()
        math.randomseed(os.time())

        local hexCoords = generateHexPositions()
        local resourcePositions = {}

        -- Pre-build tile data lookup by type for convenience
        local function makeTile(typeName)
            for _, def in ipairs(TILE_POOL) do
                if def.type == typeName then
                    return {type = def.type, imageURL = def.imageURL, resource = def.resource}
                end
            end
        end

        -- Ordered resource types for interleaving
        local resourceTypes = {"Oil Rig", "Power Plant", "Factory", "Radar Dish", "City/Village"}

        -- Index tracking: hexCoords[1]=center, [2..7]=ring1, [8..19]=ring2,
        --                  [20..37]=ring3, [38..61]=ring4

        local layout = {} -- indexed same as hexCoords

        -----------------------------------------------------------------------
        -- Ring 0 (index 1): Terrain center
        -----------------------------------------------------------------------
        layout[1] = makeTile("Terrain")

        -----------------------------------------------------------------------
        -- Ring 1 (indices 2-7): alternate resource / terrain
        -- Positions 2,4,6 → resources; 3,5,7 → terrain
        -----------------------------------------------------------------------
        local ring1Resources = {"Oil Rig", "Power Plant", "Factory"}
        local ri = 1
        for i = 2, 7 do
            if i % 2 == 0 then
                layout[i] = makeTile(ring1Resources[ri])
                layout[i].resource = true
                ri = ri + 1
            else
                layout[i] = makeTile("Terrain")
            end
        end

        -----------------------------------------------------------------------
        -- Ring 2 (indices 8-19): 6 resources + 3 Separatist Bases + 3 terrain
        -- Every 4th hex is a Separatist Base, every other pair is resource/terrain
        -----------------------------------------------------------------------
        local ring2Pattern = {
            -- index offset, tile type
            "Radar Dish", "Terrain", "Separatist Base",
            "City/Village", "Terrain", "Separatist Base",
            "Oil Rig", "Terrain", "Separatist Base",
            "Power Plant", "Factory", "Radar Dish",
        }
        local sepNumbers = {2, 4, 6}
        local sepIdx = 1
        for i = 8, 19 do
            local offset = i - 7
            local ttype = ring2Pattern[offset]
            layout[i] = makeTile(ttype)
            if ttype == "Separatist Base" then
                layout[i].number = sepNumbers[sepIdx]
                sepIdx = sepIdx + 1
            end
        end

        -----------------------------------------------------------------------
        -- Ring 3 (indices 20-37): 6 resources + 6 Spaceports + 6 terrain
        -- Evenly distribute: every 3rd position cycles resource→spaceport→terrain
        -----------------------------------------------------------------------
        local ring3Resources = {"City/Village", "Oil Rig", "Power Plant", "Factory", "Radar Dish", "City/Village"}
        local r3ri = 1
        local spaceportNum = 1
        for i = 20, 37 do
            local offset = i - 19
            local mod = (offset - 1) % 3
            if mod == 0 then
                -- Resource
                layout[i] = makeTile(ring3Resources[r3ri])
                layout[i].resource = true
                r3ri = r3ri + 1
            elseif mod == 1 then
                -- Spaceport
                layout[i] = makeTile("Spaceport")
                layout[i].number = spaceportNum
                spaceportNum = spaceportNum + 1
            else
                -- Terrain
                layout[i] = makeTile("Terrain")
            end
        end

        -----------------------------------------------------------------------
        -- Ring 4 (indices 38-61): all Terrain (outer border)
        -----------------------------------------------------------------------
        for i = 38, 61 do
            layout[i] = makeTile("Terrain")
        end

        -----------------------------------------------------------------------
        -- Spawn all tiles
        -----------------------------------------------------------------------
        for i, coord in ipairs(hexCoords) do
            local worldPos = axialToWorld(coord.q, coord.r)
            local tile = layout[i]

            local label = tile.type
            if tile.number then
                label = label .. " #" .. tostring(tile.number)
            end

            spawnHexTile(worldPos, tile, label)

            if tile.resource then
                table.insert(resourcePositions, worldPos)
            end
        end

        -- Place number tokens on the 15 resource hexes
        Wait.frames(function()
            placeNumberTokens(resourcePositions)
            broadcastToAll("W.A.R H.A.M.S — Fixed Board generated!", {r=0.2, g=1, b=0.4})
        end, 30)
    end, 5)
end

-------------------------------------------------------------------------------
-- Button Callbacks
-------------------------------------------------------------------------------

function onRandomSetup(obj, playerColor, altClick)
    broadcastToAll(playerColor .. " is generating a Random board...", {r=1, g=1, b=1})
    setupRandomBoard()
end

function onFixedSetup(obj, playerColor, altClick)
    broadcastToAll(playerColor .. " is generating a Fixed board...", {r=1, g=1, b=1})
    setupFixedBoard()
end

-------------------------------------------------------------------------------
-- On Load — create setup UI buttons on the scripted object
-------------------------------------------------------------------------------

function onLoad(saveState)
    -- Clear any leftover buttons from a previous session
    self.clearButtons()

    self.createButton({
        click_function  = "onRandomSetup",
        function_owner  = self,
        label           = "Random Board",
        position        = {-2, 0.2, 0},
        width           = 1200,
        height          = 400,
        font_size       = 200,
        color           = {r=0.2, g=0.2, b=0.2},
        font_color      = {r=1, g=1, b=1},
        tooltip         = "Generate a randomized 61-hex board",
    })

    self.createButton({
        click_function  = "onFixedSetup",
        function_owner  = self,
        label           = "Fixed Board",
        position        = {2, 0.2, 0},
        width           = 1200,
        height          = 400,
        font_size       = 200,
        color           = {r=0.2, g=0.2, b=0.2},
        font_color      = {r=1, g=1, b=1},
        tooltip         = "Generate a balanced fixed board for playtesting",
    })

    broadcastToAll("W.A.R H.A.M.S — Board Setup ready. Choose Random or Fixed.", {r=1, g=0.85, b=0})
end