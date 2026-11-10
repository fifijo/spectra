# An Agent is done when it wrote its files during this run

The Agent catalogue says what each Agent writes. The CLI and the MCP server check it, or a run claims success on work that never happened: the Generator wrote no test and the run still said `SPECTRUM COMPLETE`.

The check counts a file only when the run changed it. The run takes a snapshot of the files the Agents write when it starts — every file with the time it was last written — and a file counts when it is new or its time changed since the snapshot. The alternative was to only ask whether the file exists, and we did not, because a file left over by an earlier run passes that question: the second Scope of a Batch reused the Plan of the first, and the MCP server accepted a Plan from a previous run. A folder the Agent must write into counts as done when one of the files inside it is new or changed.

The cost of this choice: the check compares two moments of the file system's clock instead of one deadline. A file written a moment before the run started is in the snapshot, so it does not count; and a file the Agent rewrote in the same clock tick as the snapshot can look unchanged. Both windows are as narrow as the clock is coarse.
