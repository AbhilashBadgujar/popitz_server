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
	[Type(0, "array", typeof(ArraySchema<Card>))]
	public ArraySchema<Card> cards = new ArraySchema<Card>();

	[Type(1, "int8")]
	public sbyte defendedCardIndex = default(sbyte);

	[Type(2, "map", typeof(MapSchema<Player>))]
	public MapSchema<Player> players = new MapSchema<Player>();

	[Type(3, "uint8")]
	public byte turn = default(byte);

	[Type(4, "uint8")]
	public byte countdown = default(byte);

	[Type(5, "boolean")]
	public bool gameStarted = default(bool);

	[Type(6, "string")]
	public string winner = default(string);

	/*
	 * Support for individual property change callbacks below...
	 */

	protected event PropertyChangeHandler<ArraySchema<Card>> __cardsChange;
	public Action OnCardsChange(PropertyChangeHandler<ArraySchema<Card>> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.cards));
		__cardsChange += __handler;
		if (__immediate && this.cards != null) { __handler(this.cards, null); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(cards));
			__cardsChange -= __handler;
		};
	}

	protected event PropertyChangeHandler<sbyte> __defendedCardIndexChange;
	public Action OnDefendedCardIndexChange(PropertyChangeHandler<sbyte> __handler, bool __immediate = true) {
		if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
		__callbacks.AddPropertyCallback(nameof(this.defendedCardIndex));
		__defendedCardIndexChange += __handler;
		if (__immediate && this.defendedCardIndex != default(sbyte)) { __handler(this.defendedCardIndex, default(sbyte)); }
		return () => {
			__callbacks.RemovePropertyCallback(nameof(defendedCardIndex));
			__defendedCardIndexChange -= __handler;
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

	protected override void TriggerFieldChange(DataChange change) {
		switch (change.Field) {
			case nameof(cards): __cardsChange?.Invoke((ArraySchema<Card>) change.Value, (ArraySchema<Card>) change.PreviousValue); break;
			case nameof(defendedCardIndex): __defendedCardIndexChange?.Invoke((sbyte) change.Value, (sbyte) change.PreviousValue); break;
			case nameof(players): __playersChange?.Invoke((MapSchema<Player>) change.Value, (MapSchema<Player>) change.PreviousValue); break;
			case nameof(turn): __turnChange?.Invoke((byte) change.Value, (byte) change.PreviousValue); break;
			case nameof(countdown): __countdownChange?.Invoke((byte) change.Value, (byte) change.PreviousValue); break;
			case nameof(gameStarted): __gameStartedChange?.Invoke((bool) change.Value, (bool) change.PreviousValue); break;
			case nameof(winner): __winnerChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
			default: break;
		}
	}
}

