/**
 * This is the main file for your project.
 *
 * Create images, tilemaps, animations, and songs using the
 * asset explorer in VS Code. You can reference those assets
 * using the tagged templates on the assets namespace:
 *
 *     assets.image`myImageName`
 *     assets.tilemap`myTilemapName`
 *     assets.tile`myTileName`
 *     assets.animation`myAnimationName`
 *     assets.song`mySongName`
 *
 * New to MakeCode Arcade? Try creating a new project using one
 * of the templates to learn about Sprites, Tilemaps, Animations,
 * and more! Or check out the reference docs here:
 *
 * https://arcade.makecode.com/reference
 */
// Thanks Microsoft.
namespace SpriteKind {
    export const Decal = SpriteKind.create();
} // Decal is a special sprite that can be for background objects

// The constants below serve as convenient aliases for the assets, and play nice with intellisense
const SpriteTex = { // Stores sprite images, including player images
    Redman: assets.image`redman`,
    White: assets.image`white`,
    PlayerF: assets.image`player_sprite_front`,
    PlayerB: assets.image`player_sprite_back`,
    PlayerFJ: assets.image`player_sprite_front_jump`,
    PlayerBJ: assets.image`player_sprite_back_jump`,
    Tree: assets.image`tree-sprite`,
    Boulder: assets.image`boulder-sprite`,
    CaveBackdrop: assets.image`cave-flat-backdrop-sprite`,
    Blank: assets.image`blank`,
}

const SpriteAnimTex = { // Stores sprite animations, including player animations
    PlayerF: assets.animation`player_sprite_front_anim`,
    PlayerB: assets.animation`player_sprite_back_anim`,
    PlayerFS: assets.animation`player_sprite_front_slide`,
    PlayerBS: assets.animation`player_sprite_back_slide`,
    PlayerSwirl: assets.animation`player_sprite_swirl_anim`,
    Seagull: assets.animation`seagull-sprite`,
}

const TileMaps = { // Stores s
    FirstWorld: assets.tilemap`world1`,
    SecondWorld: assets.tilemap`world2`,
}

const SpecialTiles = {
    Blank: assets.tile`blank`,
    Player: assets.tile`player-spawn`,
    Portal: assets.tile`portal-spawn`,
    Tree: assets.tile`tree-spawn`,
    Boulder: assets.tile`boulder-spawn`,
    CaveBackdrop: assets.tile`cave-flat-backdrop-spawn`,
}

const Backgrounds = {
    Sky: assets.image`sky`
}
// End of the constants

// The player namespace serves as a singleton manages and serves as an interface for the player sprite
namespace Player {
    const defaultGravity = 900;
    const defaultSpeed = 30;
    const defaultfastSpeed = 225;
    export enum Directions { // Broad Version Of Possible State To Reduce The Amount Of Checking
        Left, Right, Unknown
    }
    enum PossibleState { // Used to set animation without the animation overriding itself every frame, 
        // TODO - Later, make a single function that updates stats depending on state, especially if including 
        // special states for different materials the player might stick to
        Unknown, Left, Right, LSlide, RSlide, LJump, RJump
    }
    let _sprite = sprites.create(SpriteTex.PlayerF, SpriteKind.Player);
    let _jumped: boolean = false;
    let _possible_state: PossibleState = PossibleState.Right;
    _sprite.ay = defaultGravity;
    let _lastDir: Directions = Directions.Unknown; // Last Direction Used For Animation Snapback
    let _currentDir: Directions = Directions.Unknown;
    let _pause = false;
    export function Sprite() { // Probably Pointless But Does It Matter?
        return _sprite;
    }
    export function Jump() {
        if (_pause) return;
        if (!_jumped) {
            controller.moveSprite(_sprite, defaultfastSpeed, 0) // Sets Speed Superfast When Jump Is Legal
            _sprite.vy = -275;
            if (IsOnWall()) {
                _sprite.vy += 175; // Slows Jump Velocity If Stuck To Wall
            }
            _jumped = true;
            if (_possible_state != PossibleState.LJump && _possible_state != PossibleState.RJump) { // If Jumping, Skip Code
                if (_currentDir == Directions.Left) {
                    _possible_state = PossibleState.LJump;
                } // Switch Jump State Based On Direction
                else {
                    _possible_state = PossibleState.RJump;
                }
            }
        }
    }
    export function CancelJumpOverride() { // To Be Run When Hitting The Ground Or Wall
        if (_pause) return;
        controller.moveSprite(_sprite, defaultSpeed, 0); // Reset Speed
        _jumped = false;
    }
    export function UpdateAnimation() { // Updates Animation And State
        if (_possible_state === PossibleState.Unknown) return;
        if (!_sprite.isHittingTile(CollisionDirection.Bottom)) { // Is The Player Not Touching The Ground?
            if (IsOnWall()) {
                /* Bunch of Code That Just Checks If Direction Is Right And State Isn't Already Set
                   Then Updates Animation And State, Pretty Repetitive 
                */
                if (_currentDir == Directions.Left && _possible_state != PossibleState.LSlide) {
                    animation.runImageAnimation(_sprite, SpriteAnimTex.PlayerBS, 200, true);
                    _possible_state = PossibleState.LSlide;
                }
                else if (_currentDir == Directions.Right && _possible_state != PossibleState.RSlide) {
                    animation.runImageAnimation(_sprite, SpriteAnimTex.PlayerFS, 200, true);
                    _possible_state = PossibleState.RSlide;
                }
            }
            else {
                if (_currentDir == Directions.Left) _sprite.setImage(SpriteTex.PlayerBJ);
                else _sprite.setImage(SpriteTex.PlayerFJ);
            }
        }
        else {
            if (_currentDir == Directions.Left && _possible_state != PossibleState.Left) {
                animation.runImageAnimation(_sprite, SpriteAnimTex.PlayerB, 700, true);
                _possible_state = PossibleState.Left;
            }
            else if (_currentDir == Directions.Right && _possible_state != PossibleState.Right) {
                animation.runImageAnimation(_sprite, SpriteAnimTex.PlayerF, 700, true);
                _possible_state = PossibleState.Right;
            }
        }
    } // Maps Direction Enum To Button Press
    export function IsPressed(move: Directions) {
        switch (move) {
            case Directions.Left:
                return controller.left.isPressed();
            case Directions.Right:
                return controller.right.isPressed();
            default:
                return false;
        }
    }
    export function IsOnWall() {
        return _sprite.isHittingTile(CollisionDirection.Left) || _sprite.isHittingTile(CollisionDirection.Right);
    }
    // Checks if LF Direction Has Changed, Then Saves The Previous Direction In _lastDir and Updates _currentDir
    export function RegisterLFDirection(move: Directions) {
        if (move == _currentDir) return;
        _lastDir = _currentDir;
        _currentDir = move;
    }
    /* If The Current Direction Stops Being Pressed, And The Last Direction Is, 
        Set _currentDir to _lastDir and set _lastDir to unkown
    */
    export function RegisterStopMovement(move: Directions) {
        if (move != _currentDir || !IsPressed(_lastDir)) return;
        _currentDir = _lastDir;
        _lastDir = Directions.Unknown;
    }
    // If Sprite Is On Wall Slow Gravity, else reset Gravity
    export function UpdateGravity() {
        if (_pause) return;
        if (IsOnWall() && (_possible_state == PossibleState.LSlide || _possible_state == PossibleState.RSlide)) _sprite.ay = 100;
        else _sprite.ay = defaultGravity;
    }

    export function TransitionAnimation() {
        _possible_state = PossibleState.Unknown;
        _currentDir = Directions.Unknown;
        _sprite.ay = 0;
        _sprite.vy = 0;
        controller.moveSprite(_sprite, 0, 0);
        _pause = true;
        return AnimationScheduler.New(_sprite, SpriteAnimTex.PlayerSwirl, 70, false);
    }
    export function ResetAnimation() {
        _possible_state = PossibleState.Right;
        _currentDir = Directions.Right;
        controller.moveSprite(_sprite, defaultSpeed, 0);
        _pause = false;
        UpdateAnimation();
    }
}
// Global Settings That Can Last Multiple Games
namespace GameSettings {
    export let WorldID: number = 0;
    export let PlayerLives: number = 1;
    export let Paused: boolean = false;
    export function LoadSettings() {
        if (settings.exists("world_id")) {
            console.log("Settings loaded");
            WorldID = settings.readNumber("world_id");
            PlayerLives = settings.readNumber("player_lives");
        }
    }
    export function WriteSettings() {
        settings.writeNumber("world_id", WorldID);
        settings.writeNumber("player_lives", PlayerLives);
    }
}
// Controller Callbacks For When A Button Has Been Pressed
controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!GameSettings.Paused) Player.Jump();
});
controller.up.onEvent(ControllerButtonEvent.Pressed, () => {

});
controller.down.onEvent(ControllerButtonEvent.Pressed, () => {

});
/* These Call Backs Register To Player When A Button Is Being Pressed,
    So The Player State Can Change
*/
controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!GameSettings.Paused) Player.RegisterLFDirection(Player.Directions.Left);
});
controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!GameSettings.Paused) Player.RegisterLFDirection(Player.Directions.Right);
});

controller.left.onEvent(ControllerButtonEvent.Released, () => {
    Player.RegisterStopMovement(Player.Directions.Left);
});
controller.right.onEvent(ControllerButtonEvent.Released, () => {
    Player.RegisterStopMovement(Player.Directions.Right);
});

namespace AnimationScheduler {
    const animator_counter_inc: number = 25;
    class Animator {
        counter: number = 0;
        wait: number;
        constructor(sprite: Sprite, anim: Image[], speed: number) {
            animation.runImageAnimation(sprite, anim, speed, false);
            this.wait = speed * anim.length;
        }
        Update() {
            this.counter += animator_counter_inc;
            if (this.counter > this.wait) {
                return true;
            }
            return false;
        }
    }
    let arr: [Animator, boolean][] = [];
    let freeList: number[] = [];
    export function New(sprite: Sprite, anim: Image[], speed: number, autodel?: boolean) {
        let nindex = arr.length;
        if (freeList.length != 0) {
            nindex = freeList[freeList.length - 1];
            freeList.splice(freeList.length - 1, 1);
        }
        arr[nindex] = [new Animator(sprite, anim, speed), (autodel != undefined) ? autodel : false];
        return nindex;
    }
    export function Update() {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == undefined) continue;
            let [an, b] = arr[i];
            if (an.Update() == true) {
                if (b == true) freeList.push(i);
                arr[i] = undefined;
            }
        }
    }
    export function IsValid(id: number) {
        return (arr[id] !== undefined);
    }
    export function Remove(id: number) {
        freeList.push(id);
    }
}

/* 
A Lifetime Manager for Sprites that allow you to make new sprites easily, but
also can be destroy en mass, without the need for a special spritekind,
and can also loop over all sprites inside with Query() 
*/
class SpriteArena {
    private SpriteKind: number;
    private Registry: Array<Sprite> = [];
    constructor(Kind: number) {
        this.SpriteKind = Kind;
    }
    New(img: Image) {
        this.Registry.push(sprites.create(img, this.SpriteKind));
        return this.Registry[this.Registry.length - 1];
    }
    Remove(todel: Sprite) {
        this.Registry = this.Registry.filter((val) => {
            return val != todel;
        });
        todel.destroy();
    }
    Clear(effect?: effects.ParticleEffect, duration?: number) {
        for (let s of this.Registry) {
            s.destroy(effect, duration);
        }
        this.Registry = [];
    }
    Size() {
        return this.Registry.length;
    }
    Query(_function: (spr: Sprite) => void) {
        for (let spr of this.Registry) {
            _function(spr);
        }
    }
    GetType() {
        return this.SpriteKind;
    }
}

namespace FunctionFactory {
    export function // I can't even read this 💀 Its Supposed To Gen A Function That Makes An Animated Sprite Move
        StaticMovingSpriteRange(
            setSpriteCallBack: (sprite: Sprite) => void,
            xmin: number, xmax: number,
            ymin: number, ymax: number,
            speedx: number, speedy: number,
            ms: number) {
        let counter: number = 0;
        return () => {
            counter++;
            if (counter > ms) {
                counter = 0;
                let sprite = sprites.createProjectile(SpriteTex.Blank, speedx, speedy, SpriteKind.Decal);
                sprite.setPosition(Math.randomRange(xmin, xmax), Math.randomRange(ymin, ymax));
                setSpriteCallBack(sprite);
            }
        }
    }
    export function
        StaticMovingSpriteXRange(
            setSpriteCallBack: (sprite: Sprite) => void,
            xmin: number, xmax: number,
            y: number,
            speedx: number, speedy: number,
            ms: number) {
        return StaticMovingSpriteRange(
            setSpriteCallBack,
            xmin, xmax,
            y, y,
            speedx, speedy,
            ms);
    }
    export function
        StaticMovingSpriteYRange(
            setSpriteCallBack: (sprite: Sprite) => void,
            x: number,
            ymin: number, ymax: number,
            speedx: number, speedy: number,
            ms: number) {
        return StaticMovingSpriteRange(
            setSpriteCallBack,
            x, x,
            ymin, ymax,
            speedx, speedy,
            ms);
    }
    export function SeagullFlying(x: number, ymin: number, ymax: number, speed: number, ms: number) {
        return StaticMovingSpriteYRange(
            (spr) => {
                AnimationScheduler.New(spr, SpriteAnimTex.Seagull, 350, true);
                spr.z = -200;
                spr.setFlag(SpriteFlag.GhostThroughWalls, true);
            },
            x,
            ymin, ymax,
            speed, 0,
            ms
        );
    }
}
/*
The Worlds Namespace Manages Game Worlds 
And Their Respective State
*/
namespace Worlds {
    class Instance { /* The Instance Class Wraps A Tilemap In Extra Logic For Each Instance
                        Of The World. Also Has An Dynamic Array Of Sprite Arenas 
                        It Can Destroy Automagically
                    */
        Tilemap: tiles.TileMapData;
        SpriteArenas: SpriteArena[] = [];
        StartF: (self?: Instance) => void; // These Functions Are Optional -
        UpdateF: (self?: Instance) => void; // Callbacks That Maybe Be Used -
        EndF: (self?: Instance) => void; // To Add Additional Special Logic
        HitPortalFlag: boolean = false; // Flags If Sprite Entered The Portal For The Worlds Manager
        constructor(Data: tiles.TileMapData,
            SF?: () => void, UF?: () => void, EF?: () => void) {
            this.Tilemap = Data;
            this.StartF = (SF) ? SF : function () { };
            this.UpdateF = (UF) ? UF : function () { };
            this.EndF = (EF) ? EF : function () { };
        }
        static StateClosure(Data: tiles.TileMapData,
            _tuplef: () =>
                [(self?: Instance) => void, (self?: Instance) => void, (self?: Instance) => void]) {
            let [f, s, t] = _tuplef();
            return new Instance(Data, f, s, t);
        }
        OnStart() {
            tiles.setCurrentTilemap(this.Tilemap);
            tiles.placeOnRandomTile(Player.Sprite(), SpecialTiles.Player);
            tiles.setTileAt(Player.Sprite().tilemapLocation(), SpecialTiles.Blank);
            this.StartF();
        }
        OnUpdate() {
            this.UpdateF(this);
            if (tiles.tileAtLocationEquals(Player.Sprite().tilemapLocation(), SpecialTiles.Portal)) {
                this.HitPortalFlag = true;
            }
        }
        OnEnd() {
            this.EndF(this);
            for (let arena of this.SpriteArenas) {
                arena.Clear();
            }
        }
        GetArena(kind: number) { // Automagically Returns An Arena Of SpriteKind
            for (let arena of this.SpriteArenas) {
                if (arena.GetType() === kind) return arena;
            }
            // If There Is No Arena To Be Found
            this.SpriteArenas.push(new SpriteArena(kind));
            return this.SpriteArenas[this.SpriteArenas.length - 1];
        }
    }
    let currentWorld: number = 0;
    let transitionState: boolean = false;
    let overrideTrans: boolean = false;
    let playerAnimHandle: number = 0;
    export function Init() {
        let world = GlobalArray[currentWorld];
        world.OnStart();
        LoadDecals(world);
    }
    export function Update() { // Run During Main loop, Handles World Swapping Logic
        if (transitionState) {
            if (!overrideTrans) {
                transitionState = false;
                GlobalArray[currentWorld].OnEnd();
                currentWorld++;
                if (currentWorld >= GlobalArray.length) {
                    game.splash("You've reached the end of the demo.");
                    game.reset();
                }
                else {
                    Player.ResetAnimation();
                    scene.cameraFollowSprite(Player.Sprite());
                    Init();
                }
            }
            else {
                if (!AnimationScheduler.IsValid(playerAnimHandle)) {
                    AnimationScheduler.Remove(playerAnimHandle);
                    overrideTrans = false;
                }
            }
            return;
        }
        let world = GlobalArray[currentWorld];
        world.OnUpdate();
        if (world.HitPortalFlag) {
            transitionState = true;
            overrideTrans = true;
            playerAnimHandle = Player.TransitionAnimation();
            scene.centerCameraAt(Player.Sprite().x, Player.Sprite().y);
        }
    }
    function LoadADecal(arena: SpriteArena, x: number, y: number, img: Image) {
        let sprite = arena.New(img);
        tiles.setTileAt(tiles.getTileLocation(x, y), SpecialTiles.Blank);
        sprite.setPosition(x * 16, y * 16 + Math.constrain((img.width - img.height), 0, img.height));
        sprite.z = -10; // I feel the depth needs to dynamically grow
        return sprite;
    }

    function LoadDecals(instance: Instance) { // Loops Over Tiles And Instantiates Decals Where There Are Special Tiles
        const isTile = (x: number, y: number, t: Image) => instance.Tilemap.getTileImage(instance.Tilemap.getTile(x, y)) === t;
        for (let x = 0; x < instance.Tilemap.width; x++)
            for (let y = 0; y < instance.Tilemap.height; y++) {
                if (isTile(x, y, SpecialTiles.Tree)) {
                    let sprite = LoadADecal(instance.GetArena(SpriteKind.Decal), x, y, SpriteTex.Tree);
                }
                else if (isTile(x, y, SpecialTiles.Boulder)) {
                    LoadADecal(instance.GetArena(SpriteKind.Decal), x, y, SpriteTex.Boulder);
                }
                else if (isTile(x, y, SpecialTiles.CaveBackdrop)) {
                    let sprite = LoadADecal(instance.GetArena(SpriteKind.Decal), x, y, SpriteTex.CaveBackdrop);
                    scaling.scaleByPixels(sprite, (instance.Tilemap.height - y) * 16, ScaleDirection.Vertically, ScaleAnchor.Top);
                    scaling.scaleByPixels(sprite, instance.Tilemap.width * 16, ScaleDirection.Horizontally, ScaleAnchor.Top, false);
                    sprite.z = -20;
                }
            }
    }
    // World Instance Main Location
    let GlobalArray: Instance[] = [
        new Instance(TileMaps.FirstWorld),
        Instance.StateClosure(TileMaps.SecondWorld,
            () => {
                let seagullsfly: () => void =
                    FunctionFactory.SeagullFlying
                        (TileMaps.SecondWorld.width * 16, // x
                            0, // ymin
                            TileMaps.SecondWorld.height / 2 * 16, // ymax
                            -200, // speed
                            20); // wait
                return [
                    undefined,
                    () => {
                        seagullsfly();
                    },
                    undefined
                ]
            }),
    ];
}
// Pre-Startup Initialization
GameSettings.LoadSettings();
scene.setBackgroundImage(Backgrounds.Sky);
scene.cameraFollowSprite(Player.Sprite());
info.setLife(GameSettings.PlayerLives);
scene.systemMenu.addEntry(() => "Hello?", () => {
    console.log("Clicked!");
}, SpriteTex.Redman);
Worlds.Init();
game.onUpdate(() => {
    if (GameSettings.Paused) return;
    // Code in this function will run once per frame. MakeCode
    // Arcade games run at 30 FPS
    if (Player.Sprite().isHittingTile(CollisionDirection.Bottom)
        || Player.IsOnWall()) {
        Player.CancelJumpOverride();
    }
    Player.UpdateGravity();
    Player.UpdateAnimation();
    AnimationScheduler.Update();
    Worlds.Update();
});
game.onGameOver((state) => {
    if (state === true) game.splash("WINNER");
    else game.splash("LOSER");
    game.reset();
});