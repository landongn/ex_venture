defmodule Game.Command.Emote do
  @moduledoc """
  The "emote" command
  """

  use Game.Command

  commands(["emote"], parse: false)

  @impl Game.Command
  def help(:topic), do: "Emote"
  def help(:short), do: "Perform an emote"

  def help(:full) do
    """
    Performs an emote. Anything you type after emote will be added to your name.

    Example:

    [ ] > {command}emote does something.{/command}
    {player}Player{/player} does something.

    [ ] > {command}*does something{/command}
    {player}Player{/player} does something.
    """
  end

  @impl true
  def parse(command, _context), do: parse(command)

  @impl Game.Command
  @doc """
  Parse the command into arguments

      iex> Game.Command.Emote.parse("emote hello")
      {"hello"}

      iex> Game.Command.Emote.parse("*hello")
      {"hello"}

      iex> Game.Command.Emote.parse("emote")
      {:error, :bad_parse, "emote"}

      iex> Game.Command.Emote.parse("unknown")
      {:error, :bad_parse, "unknown"}
  """
  def parse(command)
  def parse("emote " <> text), do: {text}
  def parse("*" <> text), do: {text}

  @impl Game.Command
  @doc """
  Perform an emote
  """
  def run(command, state)

  def run({emote}, %{socket: socket, user: user, save: %{room_id: room_id}}) do
    socket |> @socket.echo(Format.emote({:player, user}, emote))
    room_id |> @environment.emote({:player, user}, Message.emote(user, emote))
    :ok
  end
end
