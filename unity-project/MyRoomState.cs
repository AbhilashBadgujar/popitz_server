// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.35
// 

using Colyseus.Schema;
using Action = System.Action;
#if UNITY_5_3_OR_NEWER
using UnityEngine.Scripting;
#endif

public partial class MyRoomState : Schema {
#if UNITY_5_3_OR_NEWER
[Preserve] 
#endif
public MyRoomState() { }
	[Type(0, "number")]
	public float id = default(float);

	[Type(1, "number")]
	public float power = default(float);

	[Type(2, "string")]
	public string emo = default(string);

	[Type(3, "string")]
	public string rarity = default(string);

	[Type(4, "number")]
	public float defense = default(float);

	[Type(5, "string")]
	public string type = default(string);

	[Type(6, "number")]
	public float mojo = default(float);

	[Type(7, "number")]
	public float health = default(float);

	[Type(8, "boolean")]
	public bool isDisabled = default(bool);

	[Type(9, "array", typeof(ArraySchema<Character>))]
	public ArraySchema<Character> characters = new ArraySchema<Character>();

	[Type(10, "int8")]
	public sbyte defendedCharacterIndex = default(sbyte);

	[Type(11, "string")]
	public string sessionId = default(string);

	[Type(12, "map", typeof(MapSchema<Player>))]
	public MapSchema<Player> players = new MapSchema<Player>();

	[Type(13, "uint8")]
	public byte turn = default(byte);

	[Type(14, "uint8")]
	public byte countdown = default(byte);

	[Type(15, "boolean")]
	public bool gameStarted = default(bool);

	[Type(16, "string")]
	public string winner = default(string);

	[Type(17, "string")]
	public string worldType = default(string);

	/*
	 * Support for individual property change callbacks below...
	 */

	protected event PropertyChangeHandler<float> __idChange;
	public Action OnIdChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.id));
		__idChange += __handler;
		if (__immediate && this.id != default(float)) { __handler(this.id, default(float)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(id));
			__idChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<float> __powerChange;
	public Action OnPowerChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.power));
		__powerChange += __handler;
		if (__immediate && this.power != default(float)) { __handler(this.power, default(float)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(power));
			__powerChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __emoChange;
	public Action OnEmoChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.emo));
		__emoChange += __handler;
		if (__immediate && this.emo != default(string)) { __handler(this.emo, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(emo));
			__emoChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __rarityChange;
	public Action OnRarityChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.rarity));
		__rarityChange += __handler;
		if (__immediate && this.rarity != default(string)) { __handler(this.rarity, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(rarity));
			__rarityChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<float> __defenseChange;
	public Action OnDefenseChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.defense));
		__defenseChange += __handler;
		if (__immediate && this.defense != default(float)) { __handler(this.defense, default(float)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(defense));
			__defenseChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __typeChange;
	public Action OnTypeChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.type));
		__typeChange += __handler;
		if (__immediate && this.type != default(string)) { __handler(this.type, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(type));
			__typeChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<float> __mojoChange;
	public Action OnMojoChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.mojo));
		__mojoChange += __handler;
		if (__immediate && this.mojo != default(float)) { __handler(this.mojo, default(float)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(mojo));
			__mojoChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<float> __healthChange;
	public Action OnHealthChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.health));
		__healthChange += __handler;
		if (__immediate && this.health != default(float)) { __handler(this.health, default(float)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(health));
			__healthChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<bool> __isDisabledChange;
	public Action OnIsDisabledChange(PropertyChangeHandler<bool> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.isDisabled));
		__isDisabledChange += __handler;
		if (__immediate && this.isDisabled != default(bool)) { __handler(this.isDisabled, default(bool)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(isDisabled));
			__isDisabledChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<ArraySchema<Character>> __charactersChange;
	public Action OnCharactersChange(PropertyChangeHandler<ArraySchema<Character>> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.characters));
		__charactersChange += __handler;
		if (__immediate && this.characters != null) { __handler(this.characters, null); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(characters));
			__charactersChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<sbyte> __defendedCharacterIndexChange;
	public Action OnDefendedCharacterIndexChange(PropertyChangeHandler<sbyte> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.defendedCharacterIndex));
		__defendedCharacterIndexChange += __handler;
		if (__immediate && this.defendedCharacterIndex != default(sbyte)) { __handler(this.defendedCharacterIndex, default(sbyte)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(defendedCharacterIndex));
			__defendedCharacterIndexChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __sessionIdChange;
	public Action OnSessionIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.sessionId));
		__sessionIdChange += __handler;
		if (__immediate && this.sessionId != default(string)) { __handler(this.sessionId, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(sessionId));
			__sessionIdChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<MapSchema<Player>> __playersChange;
	public Action OnPlayersChange(PropertyChangeHandler<MapSchema<Player>> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.players));
		__playersChange += __handler;
		if (__immediate && this.players != null) { __handler(this.players, null); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(players));
			__playersChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<byte> __turnChange;
	public Action OnTurnChange(PropertyChangeHandler<byte> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.turn));
		__turnChange += __handler;
		if (__immediate && this.turn != default(byte)) { __handler(this.turn, default(byte)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(turn));
			__turnChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<byte> __countdownChange;
	public Action OnCountdownChange(PropertyChangeHandler<byte> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.countdown));
		__countdownChange += __handler;
		if (__immediate && this.countdown != default(byte)) { __handler(this.countdown, default(byte)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(countdown));
			__countdownChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<bool> __gameStartedChange;
	public Action OnGameStartedChange(PropertyChangeHandler<bool> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.gameStarted));
		__gameStartedChange += __handler;
		if (__immediate && this.gameStarted != default(bool)) { __handler(this.gameStarted, default(bool)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(gameStarted));
			__gameStartedChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __winnerChange;
	public Action OnWinnerChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.winner));
		__winnerChange += __handler;
		if (__immediate && this.winner != default(string)) { __handler(this.winner, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(winner));
			__winnerChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<string> __worldTypeChange;
	public Action OnWorldTypeChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.worldType));
		__worldTypeChange += __handler;
		if (__immediate && this.worldType != default(string)) { __handler(this.worldType, default(string)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(worldType));
			__worldTypeChange -= __handler;
		};
	}

	protected override void TriggerFieldChange(DataChange change) {
		switch (change.Field) {
			case nameof(id): __idChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
			case nameof(power): __powerChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
			case nameof(emo): __emoChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			case nameof(rarity): __rarityChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			case nameof(defense): __defenseChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
			case nameof(type): __typeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			case nameof(mojo): __mojoChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
			case nameof(health): __healthChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
			case nameof(isDisabled): __isDisabledChange?.Invoke((bool) change.Value, (bool) change.PreviousValue); break;
			case nameof(characters): __charactersChange?.Invoke((ArraySchema<Character>) change.Value, (ArraySchema<Character>) change.PreviousValue); break;
			case nameof(defendedCharacterIndex): __defendedCharacterIndexChange?.Invoke((sbyte) change.Value, (sbyte) change.PreviousValue); break;
			case nameof(sessionId): __sessionIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			case nameof(players): __playersChange?.Invoke((MapSchema<Player>) change.Value, (MapSchema<Player>) change.PreviousValue); break;
			case nameof(turn): __turnChange?.Invoke((byte) change.Value, (byte) change.PreviousValue); break;
			case nameof(countdown): __countdownChange?.Invoke((byte) change.Value, (byte) change.PreviousValue); break;
			case nameof(gameStarted): __gameStartedChange?.Invoke((bool) change.Value, (bool) change.PreviousValue); break;
			case nameof(winner): __winnerChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			case nameof(worldType): __worldTypeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			default: break;
		}
	}
}

