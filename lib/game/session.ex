defmodule Game.Session do
  @moduledoc """
  GenServer connected to the socket

  Holds knowledge if the user is logged in, who they are, what they're save is.
  """

  @type t :: pid

  use GenServer
  use Networking.Socket
  use Game.Room

  require Logger

  alias Game.Account
  alias Game.Command
  alias Game.Effect
  alias Game.Format
  alias Game.Session

  @timeout_check 5000
  @timeout_seconds 5 * 60 * -1

  @doc """
  Start a new session

  Creates a session pointing at a socket
  """
  @spec start(socket_pid :: pid) :: {:ok, pid}
  def start(socket) do
    Session.Supervisor.start_child(socket)
  end

  @doc false
  def start_link(socket) do
    GenServer.start_link(__MODULE__, socket)
  end

  @doc """
  Send a disconnect signal to a session
  """
  @spec disconnect(pid) :: :ok
  def disconnect(pid) do
    GenServer.cast(pid, :disconnect)
  end

  @doc """
  Send a recv signal from the socket
  """
  @spec recv(pid, message :: String.t) :: :ok
  def recv(pid, message) do
    GenServer.cast(pid, {:recv, message})
  end

  @doc """
  Echo to the socket
  """
  @spec echo(pid, message :: String.t) :: :ok
  def echo(pid, message) do
    GenServer.cast(pid, {:echo, message})
  end

  @doc """
  Send a tick to the session
  """
  @spec tick(pid, time :: DateTime.t) :: :ok
  def tick(pid, time) do
    GenServer.cast(pid, {:tick, time})
  end

  #
  # GenServer callbacks
  #

  def init(socket) do
    socket |> Session.Login.start()
    self() |> schedule_inactive_check()
    last_tick = Timex.now() |> Timex.shift(minutes: -2)
    {:ok, %{socket: socket, state: "login", last_move: Timex.now(), last_recv: Timex.now(), last_tick: last_tick, target: nil}}
  end

  # On a disconnect unregister the PID and stop the server
  def handle_cast(:disconnect, state = %{state: "login"}) do
    {:stop, :normal, state}
  end
  def handle_cast(:disconnect, state = %{state: "create"}) do
    {:stop, :normal, state}
  end
  def handle_cast(:disconnect, state = %{user: user, save: save}) do
    Session.Registry.unregister()
    @room.leave(save.room_id, {:user, self(), user})
    user |> Account.save(save)
    {:stop, :normal, state}
  end

  # forward the echo the socket pid
  def handle_cast({:echo, message}, state = %{socket: socket, user: user, save: save}) do
    socket |> @socket.echo(message)
    socket |> @socket.prompt(Format.prompt(user, save))
    {:noreply, state}
  end

  # Update the tick timestamp
  def handle_cast({:tick, time}, state) do
    {:noreply, Map.put(state, :last_tick, time)}
  end

  # Handle logging in
  def handle_cast({:recv, name}, state = %{state: "login"}) do
    state = Session.Login.process(name, self(), state)
    {:noreply, Map.merge(state, %{last_recv: Timex.now()})}
  end

  # Handle creating an account
  def handle_cast({:recv, name}, state = %{state: "create"}) do
    state = Session.CreateAccount.process(name, self(), state)
    {:noreply, Map.merge(state, %{last_recv: Timex.now()})}
  end

  # Receives afterwards should forward the message to the other clients
  def handle_cast({:recv, message}, state = %{socket: socket, state: "active", user: user, save: save}) do
    state = Map.merge(state, %{last_recv: Timex.now()})
    case message |> Command.parse(user) |> Command.run(self(), state) do
      :ok ->
        socket |> @socket.prompt(Format.prompt(user, save))
        {:noreply, state}
      {:update, state} ->
        socket |> @socket.prompt(Format.prompt(user, save))
        {:noreply, state}
    end
  end

  #
  # Character callbacks
  #

  def handle_cast({:targeted, player}, state) do
    echo(self(), "You are being targeted by {blue}#{player.name}{/blue}.")
    {:noreply, state}
  end

  def handle_cast({:apply_effects, effects, from}, state = %{state: "active", save: save}) do
    stats = effects |> Effect.apply(save.stats)
    save = %{save | stats: stats}
    echo(self(), "You were dealt damage from #{Format.target_name(from)}")
    {:noreply, Map.put(state, :save, save)}
  end

  def handle_info(:inactive_check, state) do
    state |> check_for_inactive()
    {:noreply, state}
  end

  # Schedule an inactive check
  defp schedule_inactive_check(pid) do
    :erlang.send_after(@timeout_check, pid, :inactive_check)
  end

  # Check if the session is inactive, disconnect if it is
  defp check_for_inactive(%{socket: socket, last_recv: last_recv}) do
    case Timex.diff(last_recv, Timex.now, :seconds) do
      time when time < @timeout_seconds ->
        Logger.info "Disconnecting player"
        socket |> @socket.disconnect()
      _ ->
        self() |> schedule_inactive_check()
    end
  end
end
