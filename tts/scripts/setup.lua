--[[
    W.A.R H.A.M.S — Tabletop Simulator Board Setup Script
    Handles Random and Fixed board layout for a 61-hex circular grid.

    Hex breakdown:
      15 Resource tiles (3 Oil Rigs, 3 Power Plants, 3 Factories, 3 Radar Dishes, 3 Cities)
       3 Separatist Bases (numbered 2, 4, 6)
       6 Spaceport Drop Zones (numbered 1-6)
      37 Terrain tiles
    
    Number tokens placed on the 15 resource hexes:
      2×1, 2×2, 3×3, 3×4, 3×5, 3×6 = 16 tokens → 15 hexes (one hex receives 2)

    Tiles are spawned as colored BlockSquare objects (no external images needed).
]]

-------------------------------------------------------------------------------
-- Constants
-------------------------------------------------------------------------------

-- Hex grid spacing: flat-top hexagons
-- A BlockSquare at scale 1 is 1 TTS unit. We scale them to ~1.3 for nice hex tiles.
-- For flat-top hex tiling with side-length s, center-to-center spacing is:
--   horizontal: 1.5 * width   vertical: sqrt(3) * width
-- At TILE_SCALE=1.3, the block is 1.3 units wide.
-- We want tiles to touch/nearly touch, so spacing = 1.3 * 1.15 = ~1.5
local HEX_SIZE    = 1.5    -- center-to-center spacing factor
local TILE_SCALE  = 1.3    -- visual scale of each hex tile (BlockSquare)
local TILE_Y      = 1.1    -- tile surface height
local TOKEN_Y     = 1.6    -- number-token height (above tile)
local TILE_TAG    = "WARHAMS_HEX"

-- Tile type definitions with colors
local TILE_TYPES = {
    ["Oil Rig"]         = {r = 0.12, g = 0.12, b = 0.12},  -- near black
    ["Power Plant"]     = {r = 0.95, g = 0.85, b = 0.10},  -- yellow
    ["Factory"]         = {r = 0.85, g = 0.15, b = 0.15},  -- red
    ["Radar Dish"]      = {r = 0.20, g = 0.40, b = 0.90},  -- blue
    ["City/Village"]    = {r = 0.15, g = 0.72, b = 0.25},  -- green
    ["Separatist Base"] = {r = 0.50, g = 0.50, b = 0.50},  -- grey
    ["Spaceport"]       = {r = 0.60, g = 0.25, b = 0.80},  -- purple
    ["Terrain"]         = {r = 0.60, g = 0.53, b = 0.40},  -- tan/brown
}

-- Tile pool definition
local TILE_POOL = {
    {type = "Oil Rig",         count = 3,  resource = true},
    {type = "Power Plant",     count = 3,  resource = true},
    {type = "Factory",         count = 3,  resource = true},
    {type = "Radar Dish",      count = 3,  resource = true},
    {type = "City/Village",    count = 3,  resource = true},
    {type = "Separatist Base", count = 3,  resource = false, numbers = {2, 4, 6}},
    {type = "Spaceport",       count = 6,  resource = false, numbers = {1, 2, 3, 4, 5, 6}},
    {type = "Terrain",         count = 37, resource = false},
}

-- Number token pool for the 15 resource hexes (16 tokens total)
local NUMBER_TOKEN_POOL = {1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6}

-------------------------------------------------------------------------------
-- Hex Grid Utilities (flat-top orientation)
-------------------------------------------------------------------------------

function axialToWorld(q, r)
    local x = HEX_SIZE * (3/2 * q)
    local z = HEX_SIZE * (math.sqrt(3)/2 * q + math.sqrt(3) * r)
    return {x = x, y = TILE_Y, z = z}
end

function generateHexPositions()
    local positions = {}
    table.insert(positions, {q = 0, r = 0})

    local directions = {
        {dq =  1, dr =  0},
        {dq =  0, dr =  1},
        {dq = -1, dr =  1},
        {dq = -1, dr =  0},
        {dq =  0, dr = -1},
        {dq =  1, dr = -1},
    }

    for ring = 1, 4 do
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
-- Shuffle (Fisher-Yates)
-------------------------------------------------------------------------------

function shuffle(t)
    for i = #t, 2, -1 do
        local j = math.random(1, i)
        t[i], t[j] = t[j], t[i]
    end
    return t
end

-------------------------------------------------------------------------------
-- Build flat tile pool
-------------------------------------------------------------------------------

function buildFlatTilePool()
    local flat = {}
    for _, def in ipairs(TILE_POOL) do
        for i = 1, def.count do
            local entry = {
                type     = def.type,
                resource = def.resource,
            }
            if def.numbers then
                entry.number = def.numbers[i]
            end
            table.insert(flat, entry)
        end
    end
    return flat
end

-------------------------------------------------------------------------------
-- Spawn a hex tile as a colored BlockSquare
-------------------------------------------------------------------------------

function spawnHexTile(position, tileData, label)
    local color = TILE_TYPES[tileData.type] or {r=0.5, g=0.5, b=0.5}
    
    spawnObject({
        type = "BlockSquare",
        position = {position.x, position.y, position.z},
        rotation = {0, 30, 0},
        scale = {TILE_SCALE, 0.15, TILE_SCALE},
        sound = false,
        callback_function = function(obj)
            obj.setName(label or tileData.type)
            obj.setDescription(tileData.type)
            obj.setColorTint(color)
            obj.setLock(true)
            obj.addTag(TILE_TAG)
        end
    })
end

-------------------------------------------------------------------------------
-- Spawn number tokens as small colored BlockSquare
-------------------------------------------------------------------------------

function spawnNumberToken(position, number, offset_x, offset_z)
    local ox = offset_x or 0
    local oz = offset_z or 0
    
    spawnObject({
        type = "BlockSquare",
        position = {position.x + ox, TOKEN_Y, position.z + oz},
        rotation = {0, 0, 0},
        scale = {0.4, 0.1, 0.4},
        sound = false,
        callback_function = function(obj)
            obj.setName("#" .. tostring(number))
            obj.setDescription("Resource number: " .. tostring(number))
            obj.setColorTint({r=0.96, g=0.93, b=0.82})
            obj.setLock(true)
            obj.addTag(TILE_TAG)
        end
    })
end

-------------------------------------------------------------------------------
-- Cleanup
-------------------------------------------------------------------------------

function cleanupBoard()
    for _, obj in ipairs(getObjects()) do
        if obj.hasTag(TILE_TAG) then
            obj.destruct()
        end
    end
end

-------------------------------------------------------------------------------
-- Place number tokens on resource hexes
-------------------------------------------------------------------------------

function placeNumberTokens(resourcePositions)
    local tokens = {}
    for _, v in ipairs(NUMBER_TOKEN_POOL) do
        table.insert(tokens, v)
    end
    shuffle(tokens)

    for i = 1, 15 do
        spawnNumberToken(resourcePositions[i], tokens[i])
    end

    -- 16th token on a random hex (offset so both visible)
    local doubleIdx = math.random(1, 15)
    spawnNumberToken(resourcePositions[doubleIdx], tokens[16], 0.35, 0.2)
end

-------------------------------------------------------------------------------
-- Random Board
-------------------------------------------------------------------------------

function setupRandomBoard()
    cleanupBoard()

    Wait.frames(function()
        math.randomseed(os.time())

        local hexCoords = generateHexPositions()
        local tiles = buildFlatTilePool()
        shuffle(tiles)

        local resourcePositions = {}

        for i, coord in ipairs(hexCoords) do
            local worldPos = axialToWorld(coord.q, coord.r)
            local tile = tiles[i]

            local label = tile.type
            if tile.number then
                label = label .. " #" .. tostring(tile.number)
            end

            spawnHexTile(worldPos, tile, label)

            if tile.resource then
                table.insert(resourcePositions, worldPos)
            end
        end

        Wait.frames(function()
            placeNumberTokens(resourcePositions)
            broadcastToAll("W.A.R H.A.M.S — Random Board generated!", {r=0.2, g=0.8, b=1})
        end, 60)
    end, 5)
end

-------------------------------------------------------------------------------
-- Fixed Board (balanced layout)
-------------------------------------------------------------------------------

function setupFixedBoard()
    cleanupBoard()

    Wait.frames(function()
        math.randomseed(os.time())

        local hexCoords = generateHexPositions()
        local resourcePositions = {}

        local function makeTile(typeName)
            for _, def in ipairs(TILE_POOL) do
                if def.type == typeName then
                    return {type = def.type, resource = def.resource}
                end
            end
        end

        local layout = {}

        -- Ring 0 (index 1): Terrain center
        layout[1] = makeTile("Terrain")

        -- Ring 1 (indices 2-7): alternate resource/terrain
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

        -- Ring 2 (indices 8-19): resources, separatist bases, terrain
        local ring2Pattern = {
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

        -- Ring 3 (indices 20-37): resources, spaceports, terrain
        local ring3Resources = {"City/Village", "Oil Rig", "Power Plant", "Factory", "Radar Dish", "City/Village"}
        local r3ri = 1
        local spaceportNum = 1
        for i = 20, 37 do
            local off = i - 19
            local mod = (off - 1) % 3
            if mod == 0 then
                layout[i] = makeTile(ring3Resources[r3ri])
                layout[i].resource = true
                r3ri = r3ri + 1
            elseif mod == 1 then
                layout[i] = makeTile("Spaceport")
                layout[i].number = spaceportNum
                spaceportNum = spaceportNum + 1
            else
                layout[i] = makeTile("Terrain")
            end
        end

        -- Ring 4 (indices 38-61): all Terrain
        for i = 38, 61 do
            layout[i] = makeTile("Terrain")
        end

        -- Spawn all tiles
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

        Wait.frames(function()
            placeNumberTokens(resourcePositions)
            broadcastToAll("W.A.R H.A.M.S — Fixed Board generated!", {r=0.2, g=1, b=0.4})
        end, 60)
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
-- On Load — create setup UI buttons
-------------------------------------------------------------------------------

function onLoad(saveState)
    self.clearButtons()

    self.createButton({
        click_function  = "onRandomSetup",
        function_owner  = self,
        label           = "Random\nBoard",
        position        = {-1.2, 0.25, 0},
        width           = 900,
        height          = 500,
        font_size       = 180,
        color           = {r=0.15, g=0.4, b=0.15},
        font_color      = {r=1, g=1, b=1},
        tooltip         = "Generate a randomized 61-hex board",
    })

    self.createButton({
        click_function  = "onFixedSetup",
        function_owner  = self,
        label           = "Fixed\nBoard",
        position        = {1.2, 0.25, 0},
        width           = 900,
        height          = 500,
        font_size       = 180,
        color           = {r=0.15, g=0.15, b=0.4},
        font_color      = {r=1, g=1, b=1},
        tooltip         = "Generate a balanced fixed board for playtesting",
    })

    broadcastToAll("W.A.R H.A.M.S — Board Setup ready. Choose Random or Fixed.", {r=1, g=0.85, b=0})
end
